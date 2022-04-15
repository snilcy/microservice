import axios from 'axios';
import { URL } from 'url';
import { Root } from '../src/Root';
import { Node } from '../src/Node';
import { Service } from '../src/Service';

const config = {
  name: 'user',
  port: 1337,
  host: 'http://localhost',
  onServerStart: () => {
    const pingUrl = new URL(`${config.host}:${config.port}`);
    pingUrl.pathname = '/ping';
    axios({ url: pingUrl.toString() }).then((response) => {
      console.log(response.data);
    });
  },
  onServerStop: () => {
    console.log(`Server ${config.name} was closed`);
  },
};

const serviceRoot = new Root({
  name: 'TestApp',
});

const node = new Node({
  name: 'MyApp',
});

const a = {
  name: 'UserService',
  state: {
    users: {},
  },
  methods: {},
};

class UserService extends Service {
  constructor() {
    super();
    this.state = {
      users: {},
    };
  }

  hello() {
    console.log('Hello from UserService');
  }

  addUser(name) {
    this.users[137] = { name };
  }

  pritUsers() {
    console.log(this.users);
  }
}

const userService = node.registerService(new UserService());

userService.hello();
userService.addUser('Johnny Rocket');
userService.pritUsers();

const messageService = node.createService({
  name: 'MessageService',
  methods: {
    hello: () => console.log('Hello from ', this.name),
  },
});
