import * as net from "net";

const clientSocket = net.createConnection({ port: 1234 }, () => {
  console.log("client connected to server!");
  clientSocket.write("world!\r\n");
});
