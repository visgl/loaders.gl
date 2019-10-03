// NOTE - there is a copy of this function is both in core and loader-utils
// core does not need all the utils in loader-utils, just this one.

/* global MessagePort, ImageBitmap, OffscreenCanvas */

// Returns an array of Transferrable objects that can be used with postMessage
// https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
export function getTransferList(object, recursive = true, transfers = []) {
  if (!object) {
    // ignore
  } else if (isTransferable(object)) {
    transfers.push(object);
  } else if (isTransferable(object.buffer)) {
    // Typed array
    transfers.push(object.buffer);
  } else if (recursive && typeof object === 'object') {
    for (const key in object) {
      // Avoid perf hit - only go one level deep
      getTransferList(object[key], recursive, transfers);
    }
  }
  return transfers;
}

// TODO - we have a set and an array based implementation, also in core
// we should keep the two in sync: cut here or update in core
/*
export default function getTransferList(object, recursive = true, transfers) {
  // Make sure that items in the transfer list is unique
  const transfersSet = transfers || new Set();

  if (!object) {
    // ignore
  } else if (object instanceof ArrayBuffer) {
    transfersSet.add(object);
  } else if (object.buffer && object.buffer instanceof ArrayBuffer) {
    // Typed array
    transfersSet.add(object.buffer);
  } else if (recursive && typeof object === 'object') {
    for (const key in object) {
      // Avoid perf hit - only go one level deep
      getTransferList(object[key], recursive, transfersSet);
    }
  }

  // If transfers is defined, is internal recursive call
  // Otherwise it's called by the user
  return transfers === undefined ? Array.from(transfersSet) : null;
}
*/

// https://developer.mozilla.org/en-US/docs/Web/API/Transferable
function isTransferable(object) {
  if (!object) {
    return false;
  }
  if (object instanceof ArrayBuffer || object.buffer instanceof ArrayBuffer) {
    return true;
  }
  if (typeof MessagePort !== 'undefined' && object instanceof MessagePort) {
    return true;
  }
  if (typeof ImageBitmap !== `undefined` && object instanceof ImageBitmap) {
    return true;
  }
  if (typeof OffscreenCanvas !== `undefined` && object instanceof OffscreenCanvas) {
    return true;
  }
  return false;
}
