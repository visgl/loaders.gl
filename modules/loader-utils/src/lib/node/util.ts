// @loaders.gl, MIT license

// type Parameter1<T extends (arg1: any, ...args: unknown[]) => unknown> = T extends (
//   arg1: infer P,
//   ...args: unknown[]
// ) => unknown
//   ? P
//   : never;

//   type Parameter2<T extends (arg1: unknown, arg2: any, ...args: unknown[]) => unknown> = T extends (
//   arg1: unknown,
//   arg2: infer P,
//   ...args: unknown[]
// ) => unknown
//   ? P
//   : never;

// type CallbackParameter2<
//   T extends (arg: unknown, cb: (error: any, value: any) => void) => unknown
// > = T extends (arg: unknown, cb: (error: any, value: infer P) => void) => unknown ? P : never;

// type CallbackParameter3<
//   T extends (arg: unknown, arg2: unknown, cb: (error: any, value: any) => void) => unknown
// > = T extends (arg: unknown, arg2: unknown, cb: (error: any, value: infer P) => void) => unknown
//   ? P
//   : never;

// /** Extract the parameters of a function type in a tuple */
// export type Promisified<F extends (arg1, cb: (error: unknown, value: any) => void) => any> = (
//   arg1: Parameter1<F>
// ) => Promise<CallbackParameter2<F>>;
// /** Extract the parameters of a function type in a tuple */
// export type Promisified2<F extends (arg1, arg2, cb: (error: unknown, value: any) => void) => any> = (
//   arg1: Parameter1<F>,
//   arg2: Parameter2<F>
// ) => Promise<CallbackParameter3<F>>;

/** Wrapper for Node.js promisify */
type Callback<A> = (error: unknown, args: A) => void;

/**
 * Typesafe promisify implementation
 * @link https://dev.to/_gdelgado/implement-a-type-safe-version-of-node-s-promisify-in-7-lines-of-code-in-typescript-2j34
 * @param fn
 * @returns
 */
export function promisify1<T, A>(fn: (args: T, cb: Callback<A>) => void): (args: T) => Promise<A> {
  return (args: T) =>
    new Promise((resolve, reject) =>
      fn(args, (error, callbackArgs) => (error ? reject(error) : resolve(callbackArgs)))
    );
}

export function promisify2<T1, T2, A>(
  fn: (arg1: T1, arg2: T2, cb: Callback<A>) => void
): (arg1: T1, arg2: T2) => Promise<A> {
  return (arg1: T1, arg2: T2) =>
    new Promise((resolve, reject) =>
      fn(arg1, arg2, (error, callbackArgs) => (error ? reject(error) : resolve(callbackArgs)))
    );
}

export function promisify3<T1, T2, T3, A>(
  fn: (arg1: T1, arg2: T2, arg3: T3, cb: Callback<A>) => void
): (arg1: T1, arg2: T2, arg3: T3) => Promise<A> {
  return (arg1: T1, arg2: T2, arg3: T3) =>
    new Promise((resolve, reject) =>
      fn(arg1, arg2, arg3, (error, callbackArgs) => (error ? reject(error) : resolve(callbackArgs)))
    );
}
