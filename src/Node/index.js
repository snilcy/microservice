import { Service } from '../Service';

export class Node {
  constructor(nodeConfig) {
    this.services = {};
    this.cnofig = nodeConfig;
  }

  createService(serviceConfig) {
    const service = new Service(serviceConfig);
    this.services[serviceConfig.name] = service;
    return service;
  }
}
