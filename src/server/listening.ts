import * as net from "net";

type Socket = net.Socket;
type Server = net.Server;

type TCPListener = {
  server: Server;
  error: null | Error;
  ended: boolean;
  reader: null | {
    resolvesTo: (s: net.Socket) => void;
    rejectsBecause: (reason: Error) => void;
  };
  pendingReads: Array<(s: Socket) => void>;
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
    pendingReads: [],
  };
  return TCPListener;
};

const listensNewConnections = (TCPListener: TCPListener) => {
  TCPListener.server.on("connection", (s: Socket) => {
    const resolver = TCPListener.pendingReads.shift();
    if (resolver) {
      resolver(s);
    }
  });
};

const onError = (tCPListener: TCPListener) => {
  tCPListener.server.on("error", (err: Error) => {
    tCPListener.error = err;

    const reader = tCPListener.reader;
    if (reader) {
      reader.rejectsBecause(err);
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
  return new Promise((resolve, reject) => {
    if (tCPListener.error) {
      reject();
      return;
    }

    tCPListener.pendingReads.push(resolve);
  });
};

const initListeningEvents = (tCPListener: TCPListener) => {
  listensNewConnections(tCPListener);
  onError(tCPListener);
};

export { accceptConnection };
