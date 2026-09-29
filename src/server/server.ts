import * as net from "net";
import { initEventListeners, sendToClient, socketMethods } from "./events";

type Socket = net.Socket;
export type TCPConn = {
  socket: Socket;
  error: null | Error;
  ended: boolean;
  reader: null | {
    resolvesTo: (value: Buffer) => void;
    rejectsBecause: (reason: Error) => void;
  };
};

const newServerConnection = async (connectionSocket: Socket): Promise<void> => {
  try {
    await serveClient(connectionSocket);
  } catch (exc) {
    console.error("exception:", exc);
  } finally {
    const { destroySocket } = socketMethods(connectionSocket);
    destroySocket();
  }
};

const createConnectionObject = (connectionSocket: Socket): TCPConn => {
  const tcpConn: TCPConn = {
    socket: connectionSocket,
    reader: null,
    error: null,
    ended: false,
  };

  return tcpConn;
};

const serveClient = async (socket: Socket): Promise<void> => {
  const conn: TCPConn = createConnectionObject(socket);
  initEventListeners(conn);

  while (true) {
    const buffer = await forBuffer(conn);

    if (buffer.length === 0) {
      console.log("end connection");
      break;
    }
    await sendToClient(conn, buffer);
  }
};

const forBuffer = async (conn: TCPConn): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    if (conn.error) {
      reject(conn.error);
      return;
    }

    if (conn.ended) {
      const EOF = Buffer.from("");
      resolve(EOF);
      return;
    }

    if (conn.reader) {
      reject(new Error("concurrent reads are not allowed"));
      return;
    }

    conn.reader = { resolvesTo: resolve, rejectsBecause: reject };
    const { resumeConnection } = socketMethods(conn.socket);
    resumeConnection();
  });
};

export { newServerConnection };
