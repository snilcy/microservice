import childProcess from 'child_process';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const microservices = {};

export const createMicroservice = (config) => {
  const microserviceProcess = childProcess.fork(
    path.resolve(__dirname, './microservice.js'),
    [JSON.stringify(config)]
  );

  microserviceProcess.on('message', (message) => {
    console.log(message);
    microserviceProcess.send({
      event: 'start',
      name: 'root',
      data: 'pong',
    });
  });

  // const microservice = new Microservise(config);
  // microservices[config.name] = microservice;
  // microservice.startServer();

  // setTimeout(() => {
  //   microservice.stopServer(() => {
  //     microservice.startServer();
  //   });
  // }, 3000);
};
