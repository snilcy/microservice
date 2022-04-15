export const getNamedFunction = (name, fn) => {
  Object.defineProperty(fn, 'name', {
    value: name,
    writable: false,
    configurable: false,
  });

  return fn;
};
