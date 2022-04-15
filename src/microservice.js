import exporess from 'express';
import http from 'http';

const config = JSON.parse(process.argv[2]);

class Microservise {
  constructor(config) {
    this.config = config;
    this.server = exporess();
    this.httpServer = http.createServer(this.server);

    this.server.get('/ping', (req, res) => {
      return res.send('pong');
    });
  }

  startServer(cb = () => {}) {
    this.server.listen(this.config.port, () => {
      console.log(
        `Server for Microservise ${this.config.name} started on port ${this.config.port}`
      );

      // this.config.onServerStart();
      process.send({
        event: 'start',
        name: config.name,
        data: 'ping',
      });
      cb();
    });
  }

  stopServer(cb) {
    this.httpServer.close(() => {
      // this.config.onServerStop();
      process.send({
        event: 'start',
        name: config.name,
      });
      cb();
    });
  }
}

const microservice = new Microservise(config);
microservice.startServer();

process.on('message', console.log);
