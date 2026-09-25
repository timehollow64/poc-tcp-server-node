import * as net from "net";

type TCPConn = {
  socket: net.Socket;
  err: null | Error;
  ended: boolean;
  reader: null | {
    resolvesTo: (value: Buffer) => void;
    rejectsBecause: (reason: Error) => void;
  };
  pendingReads: Array<(value: Buffer) => void>;
};

const server = net.createServer({ pauseOnConnect: true }, (s: net.Socket) => {
  newConnection(s);
  s.on("close", () => {
    console.log("closes");
  });
});

const newConnection = async (connectionSocket: net.Socket): Promise<void> => {
  try {
    await serveClient(connectionSocket);
  } catch (exc) {
    console.error("exception:", exc);
  } finally {
    connectionSocket.destroy();
  }
};

const initSocket = (connectionSocket: net.Socket): TCPConn => {
  const tcpConn: TCPConn = {
    socket: connectionSocket,
    reader: null,
    err: null,
    ended: false,
    pendingReads: [],
  };
  let { socket } = tcpConn;

  connectionSocket.on("data", (buffer: Buffer) => {
    socket.pause();
    const resolvesTo = tcpConn.pendingReads.shift();
    if (resolvesTo) {
      resolvesTo(buffer);
      tcpConn.reader = null;
    }
  });

  socket.on("end", () => {
    console.log("ends with empty Buffer", "EOF");

    tcpConn.ended = true;
    if (tcpConn.reader) {
      const EOF = Buffer.from("");
      tcpConn.reader.resolvesTo(EOF);
      tcpConn.reader = null;
    }
  });

  socket.on("error", (err: Error) => {
    console.error("ERROR - REJECTED");

    tcpConn.err = err;
    if (tcpConn.reader) {
      tcpConn.reader.rejectsBecause(err);
      tcpConn.reader = null;
    }
  });
  return tcpConn;
};

async function serveClient(socket: net.Socket): Promise<void> {
  const conn: TCPConn = initSocket(socket);
  while (true) {
    const data = await obtainsData(conn);
    if (data.length === 0) {
      console.log("end connection");
      break;
    }
    socket.resume();
    await sendData(conn, data);
  }
}

const sendData = (conn: TCPConn, buffer: Buffer): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (conn.err) {
      reject(conn.err);
      return;
    }

    conn.socket.write(buffer, (err?: Error | null | undefined) => {
      if (err) {
        reject(err);
      } else {
        console.log(buffer, "buffer");
        resolve();
      }
    });
  });
};

function obtainsData(conn: TCPConn): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (conn.err) {
      reject(conn.err);
      return;
    }
    if (conn.ended) {
      const EOF = Buffer.from("");
      resolve(EOF);
      return;
    }
    conn.pendingReads.push(resolve);

    conn.socket.resume();
  });
}

server.listen({ host: "127.0.0.1", port: 1234 }, () => {
  console.log("listening socket");
});
