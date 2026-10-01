import * as net from "net";
import { sendToClient, socketMethods } from "./events";

type Socket = net.Socket;

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

const serveClient = async (socket: Socket): Promise<void> => {
  for await (const buffer of socket) {
    await sendToClient(socket, buffer);
  }
};

export { newServerConnection };
