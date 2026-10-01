import * as net from "net";
import { initClientSocket } from "./client/client";
import { accceptConnection } from "./server/listening";

const server = net.createServer();

server.listen({ host: "127.0.0.1", port: 1234 });
accceptConnection(server);

const client = net.createConnection({ port: 1234 }, () => {
  initClientSocket(client);
});
