import { jest } from '@jest/globals';

import { Service, ServiceDataPrivaceError } from '.';
import { cloneDeep, deepEqual, map } from '../utils';

const wait = (time) =>
  new Promise((resolve) => setTimeout(() => resolve(time), time));

const TEST_USER_ID = 137137;
const TEST_USER_NAME = 'Meow';

const testUser = {
  name: TEST_USER_NAME,
};

const serviceName = 'TestService';

const serviceData = {
  users: {
    137: {
      name: 'Johnny',
    },
  },
  isAuth: false,
  role: undefined,
  items: [testUser, testUser],
};

const serviceMethods = {
  toggleAuth() {
    this.isAuth = !this.isAuth;
  },
  addUser(userId, name) {
    this.users[userId] = { name };
  },
  addItemsUser() {
    this.items.push(testUser);
  },
  hello() {
    console.log('Hello from ', this.serviceName);
  },
  pritUsers() {
    console.log('pritUsers', this.users);
  },
  async setDbUserObviously(userId, name) {
    await wait(13.7);
    this.users[userId] = { name };
  },
  async setDbUser(userId, name) {
    await wait(13.7);
    this.addUser(userId, name);
  },
  async setDbUserProxyfy(userId, name) {
    return wait(13.1)
      .then(() => wait(13.2))
      .then((value) =>
        this.update(() => {
          this.users[userId] = { name };
        })
      );
  },
};

const serviceParams = {
  ...serviceData,
  ...serviceMethods,
};

let service;
let serviceProxy;
let mockListener;

beforeEach(() => {
  service = new Service(serviceName, cloneDeep(serviceParams));
  serviceProxy = service.proxy;
  mockListener = jest.fn();
});

describe('Service', () => {
  describe('Initialize', () => {
    test('Should init correctly', () => {
      expect(service).toBeTruthy();
    });
    test('Should have data fields with prototype methods', () => {
      const serviceDataWithOriginalMethods = map(
        Object.getPrototypeOf(serviceProxy),
        (value) => value[Service.TEST_ORIGINAL_PROP] || value,
        {}
      );

      expect(deepEqual(serviceProxy, serviceData)).toBeTruthy();

      expect(
        deepEqual(serviceDataWithOriginalMethods, {
          ...serviceMethods,
          onUpdate: serviceProxy.onUpdate,
          update: serviceProxy.update,
        })
      ).toBeTruthy();
    });
  });
  describe('Methods', () => {
    test('Should have access to read proxy data', () => {
      expect(() => serviceProxy.pritUsers()).toBeTruthy();
    });
    test('Should have access to change proxy data', () => {
      serviceProxy.addUser(TEST_USER_ID, TEST_USER_NAME);
      expect(serviceProxy.users[TEST_USER_ID]).toEqual(testUser);
    });
    test('Async/await method should have access to change proxy data', async () => {
      await serviceProxy.setDbUser(TEST_USER_ID, TEST_USER_NAME);
      expect(serviceProxy.users[TEST_USER_ID]).toEqual(testUser);
    });
    test('Update method should have access to change proxy data obviously', () => {
      return expect(
        serviceProxy
          .setDbUserProxyfy(TEST_USER_ID, TEST_USER_NAME)
          .then(() => serviceProxy.users[TEST_USER_ID])
      ).resolves.toStrictEqual(testUser);
    });
  });
  describe('Data', () => {
    test('Should have access to read proxy data', () => {
      expect(serviceProxy.isAuth).toEqual(serviceParams.isAuth);
      expect(serviceProxy.users).toEqual(serviceParams.users);
      expect(serviceProxy.users[137]).toEqual(serviceParams.users[137]);
    });
    test("Shouldn't have access to change proxy data", () => {
      expect(() => {
        serviceProxy.isAuth = true;
      }).toThrow(ServiceDataPrivaceError);
    });
    test("Shouldn't have access to change proxy inner data", () => {
      expect(() => {
        serviceProxy.addUser(TEST_USER_ID, TEST_USER_NAME);
        const user = serviceProxy.users[TEST_USER_ID];
        user.id = TEST_USER_ID;
      }).toThrow(ServiceDataPrivaceError);
    });
    test("Async/await method shouldn't have access to change proxy data obviously", () => {
      expect(
        serviceProxy.setDbUserObviously(TEST_USER_ID, TEST_USER_NAME)
      ).rejects.toThrowError(ServiceDataPrivaceError);
    });
  });
  describe('onUpdate', () => {
    test('Should adds listener with once simple field', () => {
      serviceProxy.onUpdate(
        () => ({
          isAuth: serviceProxy.isAuth,
        }),
        mockListener
      );

      expect(Object.keys(service.dataFieldKeyListeners).length).toBe(1);
      expect(service.dataFieldKeyListeners.isAuth.length).toBe(1);
      expect(
        service.dataFieldKeyListeners.isAuth[0][Service.TEST_ORIGINAL_PROP]
      ).toBe(mockListener);
    });
    test('Should adds listener with multiple complex fields', () => {
      serviceProxy.onUpdate(
        () => ({
          isAuth: serviceProxy.isAuth,
          user: serviceProxy.users[TEST_USER_ID],
        }),
        mockListener
      );

      const expectedDataFieldKeys = [
        'isAuth',
        'users',
        Service.pathToDataFieldKey(['users', TEST_USER_ID]),
      ];

      expect(Object.keys(service.dataFieldKeyListeners)).toEqual(
        expectedDataFieldKeys
      );

      expectedDataFieldKeys.forEach((key) => {
        expect(service.dataFieldKeyListeners[key].length).toBe(1);
        expect(
          service.dataFieldKeyListeners[key][0][Service.TEST_ORIGINAL_PROP]
        ).toBe(mockListener);
      });
    });
    test('Should call listener with update args', () => {
      serviceProxy.onUpdate(
        () => ({
          isAuth: serviceProxy.isAuth,
          user: serviceProxy.users[TEST_USER_ID],
          items: serviceProxy.items,
        }),
        mockListener
      );

      serviceProxy.addUser(TEST_USER_ID, TEST_USER_NAME);
      serviceProxy.toggleAuth();

      const expectedData = {
        isAuth: serviceProxy.isAuth,
        user: serviceProxy.users[TEST_USER_ID],
        items: serviceProxy.items,
      };

      const expectedChanges = [
        {
          created: true,
          forListener: 'users',
          newValue: { name: 'Meow' },
          oldValue: undefined,
          parent: ['users'],
          path: ['users', '137137'],
          prop: '137137',
        },
        {
          created: true,
          forListener: 'users.137137',
          newValue: { name: 'Meow' },
          oldValue: undefined,
          parent: ['users'],
          path: ['users', '137137'],
          prop: '137137',
        },
        {
          created: false,
          forListener: 'isAuth',
          newValue: true,
          oldValue: false,
          parent: [],
          path: ['isAuth'],
          prop: 'isAuth',
        },
      ];

      expect(mockListener).not.toBeCalled();

      Promise.resolve().then(() => {
        expect(mockListener).toBeCalledTimes(1);
        expect(mockListener).toBeCalledWith(expectedData, expectedChanges);
      });
    });
    test('Should call listener with array args', () => {
      serviceProxy.onUpdate(
        () => ({ items: serviceProxy.items }),
        mockListener
      );

      serviceProxy.addItemsUser();

      const expectedData = {
        items: serviceProxy.items,
      };

      const expectedChanges = [
        {
          parent: ['items'],
          prop: '2',
          newValue: testUser,
          oldValue: undefined,
          path: ['items', '2'],
          created: true,
          forListener: 'items',
        },
      ];

      expect(mockListener).not.toBeCalled();

      Promise.resolve().then(() => {
        expect(mockListener).toBeCalledTimes(1);
        expect(mockListener).toBeCalledWith(expectedData, expectedChanges);
      });
    });
  });
});
