import { app } from './app';
import { getHost, getPort } from './lib/env';

const PORT = getPort();

app.listen({ port: PORT, host: getHost() }).then(() => {
  console.log(`HTTP Server Running on port ${PORT}`);
});
