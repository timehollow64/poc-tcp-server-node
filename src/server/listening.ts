import * as net from "net";

type Socket = net.Socket;
type Server = net.Server;

type TCPListener = {
  server: Server;
  error: null | Error;
  ended: boolean;
  reader: null | PromiseWithResolvers<Socket>;
};

const accceptConnection = async (s: Server) => {
  try {
    await serveListening(s);
  } catch (exc) {
    console.error(exc);
  } finally {
    s.close();
  }
};

const createListenerObject = (s: Server): TCPListener => {
  const TCPListener: TCPListener = {
    server: s,
    reader: null,
    error: null,
    ended: false,
  };
  return TCPListener;
};

const listensNewConnections = (TCPListener: TCPListener) => {
  TCPListener.server.on("connection", (s: Socket) => {
    const reader = TCPListener.reader;
    if (reader) {
      TCPListener.reader = null;
      reader.resolve(s);
    }
  });
};

const onError = (tCPListener: TCPListener) => {
  tCPListener.server.on("error", (err: Error) => {
    tCPListener.error = err;

    const reader = tCPListener.reader;
    if (reader) {
      reader.reject(err);
      tCPListener.reader = null;
    }
  });
};

const serveListening = async (server: Server) => {
  const tCPListener = createListenerObject(server);
  initListeningEvents(tCPListener);

  while (true) {
    await forSocket(tCPListener);
  }
};

const forSocket = async (tCPListener: TCPListener): Promise<Socket> => {
  if (tCPListener.error) throw tCPListener.error;
  const { promise, resolve, reject } = Promise.withResolvers<Socket>();
  if (tCPListener.reader) throw new Error("concurrent reads are not allowed");

  tCPListener.reader = { promise, resolve, reject };
  return tCPListener.reader.promise;
};

const initListeningEvents = (tCPListener: TCPListener) => {
  listensNewConnections(tCPListener);
  onError(tCPListener);
};

export { accceptConnection };
