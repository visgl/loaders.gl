// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import DoublyLinkedListNode from '../utils/doubly-linked-list-node';

/**
 * Doubly linked list
 *
 * @private
 */
export default class DoublyLinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this._length = 0;
  }

  get length() {
    return this._length;
  }

  /**
   * Adds the item to the end of the list
   * @param {*} [item]
   * @return {DoublyLinkedListNode}
   */
  add(item) {
    const node = new DoublyLinkedListNode(item, this.tail, null);

    if (this.tail) {
      this.tail.next = node;
      this.tail = node;
    } else {
      this.head = node;
      this.tail = node;
    }

    ++this._length;

    return node;
  }

  /**
   * Removes the given node from the list
   * @param {DoublyLinkedListNode} node
   */
  remove(node) {
    if (!node) {
      return;
    }

    if (node.previous && node.next) {
      node.previous.next = node.next;
      node.next.previous = node.previous;
    } else if (node.previous) {
      // Remove last node
      node.previous.next = null;
      this.tail = node.previous;
    } else if (node.next) {
      // Remove first node
      node.next.previous = null;
      this.head = node.next;
    } else {
      // Remove last node in the linked list
      this.head = null;
      this.tail = null;
    }

    node.next = null;
    node.previous = null;

    --this._length;
  }

  /**
   * Moves nextNode after node
   * @param {DoublyLinkedListNode} node
   * @param {DoublyLinkedListNode} nextNode
   */
  splice(node, nextNode) {
    if (node === nextNode) {
      return;
    }

    // Remove nextNode, then insert after node
    this.remove(nextNode);
    this._insert(node, nextNode);
  }

  _insert(node, nextNode) {
    const oldNodeNext = node.next;
    node.next = nextNode;

    // nextNode is the new tail
    if (this.tail === node) {
      this.tail = nextNode;
    } else {
      oldNodeNext.previous = nextNode;
    }

    nextNode.next = oldNodeNext;
    nextNode.previous = node;

    ++this._length;
  }
}
