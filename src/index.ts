import * as net from "net";
import { newServerConnection } from "./server/server";
import { initClientSocket } from "./client/client";
import { accceptConnection } from "./server/listening";

const config = { pauseOnConnect: true };
const server = net.createServer(config, async (s: net.Socket) => {
  await newServerConnection(s);
});

server.listen({ host: "127.0.0.1", port: 1234 });
accceptConnection(server);

const client = net.createConnection({ port: 1234 }, () => {
  initClientSocket(client);
});
