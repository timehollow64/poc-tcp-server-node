import * as net from "net";
import { initEventListeners, sendToClient, socketMethods } from "./events";

export type TCPConn = {
  socket: net.Socket;
  error: null | Error;
  ended: boolean;
  reader: null | {
    resolvesTo: (value: Buffer) => void;
    rejectsBecause: (reason: Error) => void;
  };
  pendingReads: Array<(value: Buffer) => void>;
};

const newServerConnection = async (
  connectionSocket: net.Socket,
): Promise<void> => {
  try {
    await serveClient(connectionSocket);
  } catch (exc) {
    console.error("exception:", exc);
  } finally {
    const { destroySocket } = socketMethods(connectionSocket);
    destroySocket();
  }
};

const createConnectionObject = (connectionSocket: net.Socket): TCPConn => {
  const tcpConn: TCPConn = {
    socket: connectionSocket,
    reader: null,
    error: null,
    ended: false,
    pendingReads: [],
  };

  return tcpConn;
};

const serveClient = async (socket: net.Socket): Promise<void> => {
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

    conn.pendingReads.push(resolve);
    const { resumeConnection } = socketMethods(conn.socket);
    resumeConnection();
  });
};

export { newServerConnection };
