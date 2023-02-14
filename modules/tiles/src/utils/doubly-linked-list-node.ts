// loaders.gl, MIT license

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/**
 * Doubly linked list node
 * @private
 */
export class DoublyLinkedListNode {
  item;
  previous;
  next;

  constructor(item, previous, next) {
    this.item = item;
    this.previous = previous;
    this.next = next;
  }
}
