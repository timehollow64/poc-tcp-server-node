import { on } from "node:events";
import * as net from "node:net";

const sendToClient = async (
  socket: net.Socket,
  buffer: Buffer,
): Promise<void> => {
  const { promise, resolve, reject } = Promise.withResolvers<void>();

  socket.write(buffer, (err?: Error | null | undefined) => {
    if (err) {
      reject(err);
    } else {
      console.log(`"envío esto:" ${buffer}`);
      resolve();
    }
  });

  return promise;
};

const handleClient = async (socket: net.Socket): Promise<void> => {
  try {
    await serveData(socket);
  } catch (exc) {
    console.error("exception:", exc);
  } finally {
    socket.destroy();
  }
};

const serveData = async (socket: net.Socket): Promise<void> => {
  const chunks = on(socket, "data", { close: ["end"], highWaterMark: 16 });

  for await (const [buffer] of chunks) {
    console.log("Captured Buffer:", buffer, "String: ", buffer.toString());
  }
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

export { sendToClient, socketMethods, handleClient };
