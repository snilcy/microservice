import { isObject, isArray } from './type';

export const forEach = (obj, callback) =>
  Object.entries(obj).forEach(([key, value]) => callback(value, key));

export const _forEach = (callback) => (obj) =>
  Object.entries(obj).forEach(([key, value]) => callback(value, key));

export const map = (obj, callback, target) =>
  Object.entries(obj).reduce((result, [key, value], id) => {
    result[key] = callback(value, key);
    return result;
  }, target || obj);

export const _map = (callback, target) => (obj) =>
  Object.entries(obj).reduce((result, [key, value]) => {
    result[key] = callback(value, key);
    return result;
  }, target || obj);

// export const map = (callback) => (data) =>
// isArray(data) ? data.map(callback) : reduce(callback, obj)(obj);

export const cloneDeep = (data) =>
  map(
    data,
    (value) => (isObject(value) ? cloneDeep(value) : value),
    isArray(data) ? [] : {}
  );

export const filterUniqu = (path, id, arr) => arr.lastIndexOf(path) === id;
