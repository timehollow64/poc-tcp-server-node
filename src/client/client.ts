import * as net from "net";

const initClientSocket = (s: net.Socket) => {
  s.on("data", (data) => {
    console.log("Received:", data.toString());
  });
};

export { initClientSocket };
