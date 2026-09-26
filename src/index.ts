import * as net from "net";
import { newServerConnection } from "./server/server";
import { initClientSocket } from "./client/client";
import { socketMethods } from "./server/events";

const config = { pauseOnConnect: true };
const server = net.createServer(config, (s: net.Socket) => {
  const { close } = socketMethods(s);

  newServerConnection(s);

  close();
});

server.listen({ host: "127.0.0.1", port: 1234 }, () => {
  console.log("listening socket");
});

const client = net.createConnection({ port: 1234 }, () => {
  initClientSocket(client);

  console.log("client connected to server!");
});
