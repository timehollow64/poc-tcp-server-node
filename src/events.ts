import { TCPConn } from "./script";
import * as net from "node:net";

const onData = (tcpConn: TCPConn): void => {
  let { socket, pendingReads } = tcpConn;

  socket.on("data", (buffer: Buffer) => {
    const { pauseWhileResolving } = socketMethods(socket);
    pauseWhileResolving();

    const resolvesTo = pendingReads.shift();
    if (resolvesTo) {
      resolvesTo(buffer);
      tcpConn.reader = null;
    }
  });
};

const onEnd = (tcpConn: TCPConn): void => {
  let { socket } = tcpConn;

  socket.on("end", () => {
    tcpConn.ended = true;

    const reader = tcpConn.reader;
    if (reader) {
      const EOF = Buffer.from("");
      reader.resolvesTo(EOF);
      tcpConn.reader = null;
    }
  });
};

const onError = (tcpConn: TCPConn) => {
  let { socket } = tcpConn;

  socket.on("error", (err: Error) => {
    console.error("ERROR - REJECTED");
    tcpConn.error = err;

    const reader = tcpConn.reader;
    if (reader) {
      reader.rejectsBecause(err);
      tcpConn.reader = null;
    }
  });
};

const sendToClient = async (conn: TCPConn, buffer: Buffer): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (conn.error) {
      reject(conn.error);
      return;
    }

    conn.socket.write(buffer, (err?: Error | null | undefined) => {
      if (err) {
        reject(err);
      } else {
        console.log(`"envío esto:" ${buffer}`);
        resolve();
      }
    });
  });
};

const initEventListeners = (tcpConn: TCPConn): void => {
  onData(tcpConn);
  onError(tcpConn);
  onEnd(tcpConn);
};

const socketMethods = (s: net.Socket) => {
  return {
    pauseWhileResolving: (): void => {
      s.pause();
    },
    resumeConnection: (): void => {
      s.resume();
    },
    destroySocket: (): void => {
      s.destroy();
    },
    close: (): void => {
      s.on("close", () => {
        console.log("closing...");
      });
    },
  };
};

export { initEventListeners, sendToClient, socketMethods };
