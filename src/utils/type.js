import { getConstructorName } from './get';

const CONSTRUCTOR = {
  Promise: 'Promise',
  AsyncFunction: 'AsyncFunction',
};

const isConstructor = (constructor) => (fn) =>
  getConstructorName(fn) === constructor;

export const isFunction = (val) => typeof val === 'function';
export const isObject = (val) => typeof val === 'object' && val !== null;
export const isArray = (val) => Array.isArray(val);

export const isPromise = isConstructor(CONSTRUCTOR.Promise);
export const isAsyncFunction = isConstructor(CONSTRUCTOR.AsyncFunction);

export const isUndefined = (val) => typeof val === 'undefined';
