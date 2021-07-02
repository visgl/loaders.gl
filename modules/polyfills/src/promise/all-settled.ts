export const REJECTED_STATUS = 'rejected';
export const FULFILLED_STATUS = 'fulfilled';

/**
 * Handle list of promises and return all values regardless of results.
 * Polyfill for Promise.allSettled() method.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
 * @param promises
 */
export function allSettled(promises: Promise<any>[]): Promise<any> {
  const mappedPromises = promises.map((promise) => {
    return promise
      .then((value) => {
        return {status: FULFILLED_STATUS, value};
      })
      .catch((reason) => {
        return {status: REJECTED_STATUS, reason};
      });
  });
  return Promise.all(mappedPromises);
}
