import { WebSocketServer, WebSocket } from 'ws';

const server = new WebSocketServer({ port: 1337 });

server.on('connection', (socket) => {
  console.log('server connection');
  socket.on('message', (...args) => console.log('message', args));
  socket.send('Hello world');
});

const client = new WebSocket('ws://localhost:1337');

client.on('open', (...args) => {
  console.log('client open', args);
});

client.on('message', (...args) => {
  console.log('client message', args[0].toString(), args[1]);
});

export class Root {
  constructor(rootConfig) {
    // this.nodes = {};
    // this.cnofig = rootConfig;
  }

  createNode(nodeConfig) {
    // const node = new Node(nodeConfig);
    // this.nodes[nodeConfig.name] = node;
    // return node;
  }
}
