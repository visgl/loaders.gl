// Returns an array of Transferrable objects that can be used with
// postMessage: https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
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
