export const flowLeft =
  (...fns) =>
  (arg) =>
    fns.reduce((lastArg, fn) => fn(lastArg), arg);

export const flowRight =
  (...fns) =>
  (arg) =>
    fns.reduceRight((lastArg, fn) => fn(lastArg), arg);
