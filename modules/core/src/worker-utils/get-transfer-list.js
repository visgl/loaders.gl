// NOTE - there is a copy of this function is both in core and loader-utils
// core does not need all the utils in loader-utils
// https://developer.mozilla.org/en-US/docs/Web/API/Transferable

/* global MessagePort, ImageBitmap, OffscreenCanvas */

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
