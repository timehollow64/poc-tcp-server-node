import { on } from "node:events";
import * as net from "net";
import { newServerConnection } from "./server";
import { handleClient } from "./events";

type Server = net.Server;

const accceptConnection = async (server: Server) => {
  try {
    await serveListening(server);
  } catch (exc) {
    console.error(exc);
  } finally {
    server.close();
  }
};

const serveListening = async (server: Server) => {
  const connections = on(server, "connection", { close: ["close"] });

  for await (const [socket] of connections) {
    void newServerConnection(socket);
    void handleClient(socket);
  }
};

export { accceptConnection };
