import { isFunction, isObject } from './type';

export const propExists = (obj, prop) => prop in obj;
export const isEqual = (first, second) => first === second;
export const isSame = isEqual;
export const isEmpty = (arr) => arr.length === 0;

export const isEqualProp = (first, second, prop) =>
  propExists(first, prop) &&
  propExists(second, prop) &&
  isEqual(first[prop], second[prop]);

export const deepEqual = (first, second) => {
  // if (isFunction(first)) {
  //   return isTestNodeEnv
  //     ? isSame(first, second) || isEqualProp(first, second, 'origin')
  //     : isSame(first, second);
  // }

  if (!isObject(first)) return isSame(first, second);

  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);

  if (!isEqualProp(firstKeys, secondKeys, 'length')) return false;

  return firstKeys.every((key) => deepEqual(first[key], second[key]));
};
