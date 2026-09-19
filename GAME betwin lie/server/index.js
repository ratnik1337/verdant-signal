require('dotenv').config();
const { createApp } = require('./app');

const port = Number(process.env.PORT || 3000);
const app = createApp();
const server = app.listen(port, () => {
  console.log(`Verdant Signal listening at http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    app.locals.close();
    process.exit(0);
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
