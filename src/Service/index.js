// TODO стрелочные методы

import {
  isFunction,
  isArray,
  isObject,
  isTestNodeEnv,
  getNamedFunction,
  propExists,
  filterUniqu,
  forEach,
  first,
  last,
  isEmpty,
  map,
  isPromise,
} from '../utils';

// data
// trackingDataFields
// dataFieldKey
// listener

// listener
// trackingDataFields props

// dataFieldKeyListeners props -> listener
// sheduleListeners += listener -> [changes]
// needCallUpdate needUpdate
// batchUpdate sheduleListeners listener([changes])

export class ServiceDataPrivaceError extends Error {
  constructor(message, data) {
    super(message);
    this.data = data;
  }
}

export class Service {
  constructor(serviceName, params) {
    this.serviceName = serviceName;

    // update
    this.trackingDataFields = null; // data props
    this.dataFieldKeyListeners = {}; // data prop -> listener
    this.needCallUpdate = false;
    this.sheduleListeners = new Map(); // listener -> [changed props]

    this.isPrivateChanges = false;

    this.callWithCtxResult(() => {
      this.data = this.getData(params);
      this.proxy = this.proxyfy(this.data);
    });
  }

  static SPLIT_DIVIDER = '\\__;.,__//';
  static TEST_ORIGINAL_PROP = Symbol('origin');

  static pathToDataFieldKey = (path) => path.join(Service.SPLIT_DIVIDER);

  static dataFieldKeyToPath = (string) => string.split(Service.SPLIT_DIVIDER);

  static normalizeDataFieldKey = (string) =>
    Service.dataFieldKeyToPath(string).join('.');

  static getDataFieldKeysByPathArr = (pathArr) =>
    pathArr.map((_, id, arr) =>
      Service.pathToDataFieldKey(arr.slice(0, id + 1))
    );

  static getObjValueByPathArr = (obj, pathArr = []) =>
    isEmpty(pathArr)
      ? obj
      : Service.getObjValueByPathArr(obj[first(pathArr)], pathArr.slice(1));

  static setObjValueByPathArr = (obj, value, pathArr = []) => {
    const lastObj = Service.getObjValueByPathArr(obj, pathArr.slice(0, -1));
    lastObj[last(pathArr)] = value;
  };

  static patchFunctionWtihTestOrigin = (fn, value) => {
    Object.defineProperty(fn, Service.TEST_ORIGINAL_PROP, {
      value,
      enumerable: false,
      configurable: false,
      writable: false,
    });
  };

  callWithCtxResult = (fn, ...args) => {
    this.isPrivateChanges = true;
    const result = fn.apply(this.proxy, args);
    this.isPrivateChanges = false;
    return isPromise(result) ? result : this.proxy;
  };

  update = this.callWithCtxResult;

  getData = (params) => {
    const methods = {};
    const data = {};

    forEach(params, (value, key) => {
      if (!isFunction(value)) return (data[key] = value);

      const method = getNamedFunction(
        `${this.serviceName}.PrivateFunciton.${key}`,
        (...args) => this.callWithCtxResult(value, ...args)
      );

      if (isTestNodeEnv) Service.patchFunctionWtihTestOrigin(method, value);

      methods[key] = method;
    });

    const prototype = {
      ...methods,
      onUpdate: this.onUpdate,
      update: this.update,
    };

    const target = Object.create(prototype);

    return Object.assign(target, data);
  };

  onUpdate = (getData, callback) => {
    this.trackingDataFields = [];

    getData();

    const listener = getNamedFunction(
      `${this.serviceName}.onUpdateCallback`,
      (logData) => callback(getData(), logData)
    );

    if (isTestNodeEnv) {
      Service.patchFunctionWtihTestOrigin(listener, callback);
    }

    this.trackingDataFields
      .map(Service.pathToDataFieldKey)
      .filter(filterUniqu)
      .forEach((dataFieldKey) => {
        const listeners = this.dataFieldKeyListeners[dataFieldKey] || [];
        this.dataFieldKeyListeners[dataFieldKey] = listeners.concat(listener);
      });

    this.trackingDataFields = null;
  };

  proxyfy = (data, parents = []) => {
    if (isObject(data)) {
      map(data, (value, key) => this.proxyfy(value, parents.concat(key)));
      return new Proxy(data, this.getDataProxyHandler(parents));
    }

    return data;
  };

  getDataPrivaceError = (data) =>
    new ServiceDataPrivaceError(
      `You must use ${this.serviceName}'s methods for data changes`,
      data
    );

  getDataProxyHandler = (parents = []) => ({
    get: (target, prop) => {
      const isListenersSetup = Boolean(this.trackingDataFields);

      if (!isFunction(target[prop]) && isListenersSetup) {
        this.trackingDataFields.push(parents.concat(prop));
      }

      return target[prop];
    },
    set: (target, prop, val) => {
      const pathArr = parents.concat(prop);

      if (!this.isPrivateChanges) {
        throw this.getDataPrivaceError({
          prop,
          value: val,
          target,
          parents,
        });
      }

      if (isArray(target) && prop === 'length') return true;

      const oldValue = target[prop];
      const created = !propExists(target, prop);

      this.needUpdate();

      const dataFieldKeys = Service.getDataFieldKeysByPathArr(pathArr);

      dataFieldKeys.forEach((dataFieldKey) => {
        const listeners = this.dataFieldKeyListeners[dataFieldKey] || [];

        listeners.forEach((listener) => {
          const logData = {
            parent: parents,
            prop,
            newValue: val,
            oldValue,
            path: pathArr,
            created,
            forListener: Service.normalizeDataFieldKey(dataFieldKey),
          };

          const sheduleListeners = this.sheduleListeners.get(listener) || [];
          sheduleListeners.push(logData);
          this.sheduleListeners.set(listener, sheduleListeners);
        });
      });

      target[prop] = this.proxyfy(val, pathArr);
      return true;
    },
    deleteProperty: (target, prop) => {
      throw this.getDataPrivaceError({
        prop,
        target,
        parents,
      });
    },
  });

  batchUpdate() {
    for (const [callback, changes] of this.sheduleListeners) {
      callback(changes);
    }
    this.sheduleListeners = new Map();
  }

  needUpdate = () => {
    // once call
    if (this.needCallUpdate) return;
    this.needCallUpdate = true;

    // flush callstack
    Promise.resolve().then(() => {
      this.needCallUpdate = false;
      this.batchUpdate();
    });
  };
}
