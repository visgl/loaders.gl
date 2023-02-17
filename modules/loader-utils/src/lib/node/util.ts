// @loaders.gl, MIT license

/** Wrapper for Node.js promisify */
type Callback<A> = (args: A) => void;

/**
 * Typesafe promisify implementation
 * @link https://dev.to/_gdelgado/implement-a-type-safe-version-of-node-s-promisify-in-7-lines-of-code-in-typescript-2j34
 * @param fn
 * @returns
 */
export function promisify1<T, A>(fn: (args: T, cb: Callback<A>) => void): (args: T) => Promise<A> {
  return (args: T) =>
    new Promise((resolve) => {
      fn(args, (callbackArgs) => {
        resolve(callbackArgs);
      });
    });
}

export function promisify2<T1, T2, A>(
  fn: (arg1: T1, arg2: T2, cb: Callback<A>) => void
): (arg1: T1, arg2: T2) => Promise<A> {
  return (arg1: T1, arg2: T2) =>
    new Promise((resolve) => {
      fn(arg1, arg2, (callbackArgs) => {
        resolve(callbackArgs);
      });
    });
}
