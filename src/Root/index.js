import { Node } from '../Node';

export class Root {
  constructor(rootConfig) {
    this.nodes = {};
    this.cnofig = rootConfig;
  }

  createNode(nodeConfig) {
    const node = new Node(nodeConfig);
    this.nodes[nodeConfig.name] = node;
    return node;
  }
}
