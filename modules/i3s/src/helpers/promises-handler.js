export const REJECTED_STATUS = 'rejected';
export const FULFILLED_STATUS = 'fulfilled';

/**
 * Handle list of promises based on browser compatibility
 * @param {Promise[]} promises
 * @returns {Promise}
 */
export function handlePromises(promises) {
  return Promise.allSettled ? Promise.allSettled(promises) : Promise.all(promises.map(reflect));
}

function reflect(promise) {
  return promise.then(
    value => {
      return {status: FULFILLED_STATUS, value};
    },
    error => {
      return {status: REJECTED_STATUS, reason: error};
    }
  );
}
