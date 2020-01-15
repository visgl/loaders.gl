// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import DoublyLinkedList from '@loaders.gl/3d-tiles/lib/utils/doubly-linked-list';

function expectOrder(t, list, nodes) {
  // Assumes at least one node is in the list
  const length = nodes.length;

  t.equals(list.length, length);

  // Verify head and tail pointers
  t.equals(list.head, nodes[0]);
  t.equals(list.tail, nodes[length - 1]);

  // Verify that linked list has nodes in the expected order
  let node = list.head;
  for (let i = 0; i < length; ++i) {
    const nextNode = i === length - 1 ? null : nodes[i + 1];
    const previousNode = i === 0 ? null : nodes[i - 1];

    t.equals(node, nodes[i]);
    t.equals(node.next, nextNode);
    t.equals(node.previous, previousNode);

    node = node.next;
  }
}

test('DoublyLinkedList#constructs', t => {
  const list = new DoublyLinkedList();
  t.equals(list.head, null);
  t.equals(list.head, null);
  t.equals(list.length, 0);

  t.end();
});

// eslint-disable-next-line max-statements
test('DoublyLinkedList#adds items', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);

  //   node
  //  ^     ^
  //  |     |
  // head  tail
  t.equals(list.head, node);
  t.equals(list.tail, node);
  t.equals(list.length, 1);

  t.ok(node);
  t.equals(node.item, 1);
  t.notOk(node.previous);
  t.notOk(node.next);

  const node2 = list.add(2);

  //  node <-> node2
  //  ^         ^
  //  |         |
  // head      tail
  t.equals(list.head, node);
  t.equals(list.tail, node2);
  t.equals(list.length, 2);

  t.ok(node2);
  t.equals(node2.item, 2);
  t.equals(node2.previous, node);
  t.notOk(node2.next);

  t.equals(node.next, node2);

  const node3 = list.add(3);

  //  node <-> node2 <-> node3
  //  ^                    ^
  //  |                    |
  // head                 tail
  t.equals(list.head, node);
  t.equals(list.tail, node3);
  t.equals(list.length, 3);

  t.ok(node3);
  t.equals(node3.item, 3);
  t.equals(node3.previous, node2);
  t.notOk(node3.next);
  t.equals(node2.next, node3);

  t.end();
});

test('DoublyLinkedList#removes from a list with one item', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);

  list.remove(node);
  t.notOk(list.head);
  t.notOk(list.tail);
  t.equals(list.length, 0);

  t.end();
});

test('DoublyLinkedList#removes head of list', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);

  list.remove(node);

  t.equals(list.head, node2);
  t.equals(list.tail, node2);
  t.equals(list.length, 1);

  t.end();
});

test('DoublyLinkedList#removes tail of list', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);

  list.remove(node2);

  t.equals(list.head, node);
  t.equals(list.tail, node);
  t.equals(list.length, 1);

  t.end();
});

test('DoublyLinkedList#removes middle of list', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  const node3 = list.add(3);

  list.remove(node2);

  t.equals(list.head, node);
  t.equals(list.tail, node3);
  t.equals(list.length, 2);

  t.end();
});

test('DoublyLinkedList#removes nothing', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);

  list.remove();

  t.equals(list.head, node);
  t.equals(list.tail, node);
  t.equals(list.length, 1);

  t.end();
});

test('DoublyLinkedList#splices nextNode before node', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  const node3 = list.add(3);
  const node4 = list.add(4);
  const node5 = list.add(5);

  // Before:
  //
  //  node <-> node2 <-> node3 <-> node4 <-> node5
  //  ^          ^                   ^          ^
  //  |          |                   |          |
  // head     nextNode             node        tail

  // After:
  //
  //  node <-> node3 <-> node4 <-> node2 <-> node5
  //  ^                                         ^
  //  |                                         |
  // head                                      tail

  // Move node2 after node4
  list.splice(node4, node2);
  expectOrder(t, list, [node, node3, node4, node2, node5]);

  t.end();
});

test('DoublyLinkedList#splices nextNode after node', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  const node3 = list.add(3);
  const node4 = list.add(4);
  const node5 = list.add(5);

  // Before:
  //
  //  node <-> node2 <-> node3 <-> node4 <-> node5
  //  ^          ^                   ^          ^
  //  |          |                   |          |
  // head      node              nextNode      tail

  // After:
  //
  //  node <-> node2 <-> node4 <-> node3 <-> node5
  //  ^                                         ^
  //  |                                         |
  // head                                      tail

  // Move node4 after node2
  list.splice(node2, node4);
  expectOrder(t, list, [node, node2, node4, node3, node5]);

  t.end();
});

test('DoublyLinkedList#splices nextNode immediately before node', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  const node3 = list.add(3);
  const node4 = list.add(4);

  // Before:
  //
  //  node <-> node2 <-> node3 <-> node4
  //  ^          ^         ^         ^
  //  |          |         |         |
  // head     nextNode    node      tail

  // After:
  //
  //  node <-> node3 <-> node2 <-> node4
  //  ^                              ^
  //  |                              |
  // head                           tail

  // Move node2 after node4
  list.splice(node3, node2);
  expectOrder(t, list, [node, node3, node2, node4]);

  t.end();
});

test('DoublyLinkedList#splices nextNode immediately after node', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  const node3 = list.add(3);
  const node4 = list.add(4);

  // Before:
  //
  //  node <-> node2 <-> node3 <-> node4
  //  ^          ^         ^         ^
  //  |          |         |         |
  // head      node    nextNode     tail

  // After: does not change

  list.splice(node2, node3);
  expectOrder(t, list, [node, node2, node3, node4]);

  t.end();
});

test('DoublyLinkedList#splices node === nextNode', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  const node3 = list.add(3);

  // Before:
  //
  //  node <-> node2 <-> node3
  //  ^          ^         ^
  //  |          |         |
  // head  node/nextNode  tail

  // After: does not change

  list.splice(node2, node2);
  expectOrder(t, list, [node, node2, node3]);

  t.end();
});

test('DoublyLinkedList#splices when nextNode was tail', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  const node3 = list.add(3);
  const node4 = list.add(4);

  // Before:
  //
  //  node <-> node2 <-> node3 <-> node4
  //  ^          ^                   ^
  //  |          |                   |
  // head      node           tail/nextNode

  // After:
  //
  //  node <-> node2 <-> node4 <-> node3
  //  ^                               ^
  //  |                               |
  // head                            tail

  list.splice(node2, node4);
  expectOrder(t, list, [node, node2, node4, node3]);

  t.end();
});

test('DoublyLinkedList#splices when node was tail', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  const node3 = list.add(3);
  const node4 = list.add(4);

  // Before:
  //
  //  node <-> node2 <-> node3 <-> node4
  //  ^          ^                   ^
  //  |          |                   |
  // head      nextNode           tail/node

  // After:
  //
  //  node <-> node3 <-> node4 <-> node2
  //  ^                              ^
  //  |                              |
  // head                         tail/node

  list.splice(node4, node2);
  expectOrder(t, list, [node, node3, node4, node2]);

  t.end();
});

test('DoublyLinkedList#splices when nextNode was head', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  const node3 = list.add(3);
  const node4 = list.add(4);

  // Before:
  //
  //  node <-> node2 <-> node3 <-> node4
  //  ^                   ^         ^
  //  |                   |         |
  // head/nextNode       node      tail

  // After:
  //
  //  node2 <-> node3 <-> node <-> node4
  //  ^                              ^
  //  |                              |
  // head                           tail

  list.splice(node3, node);
  expectOrder(t, list, [node2, node3, node, node4]);

  t.end();
});

test('DoublyLinkedList#splices when node was head', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  const node3 = list.add(3);
  const node4 = list.add(4);

  // Before:
  //
  //  node <-> node2 <-> node3 <-> node4
  //  ^                   ^         ^
  //  |                   |         |
  // head/node        nextNode      tail

  // After:
  //
  //  node <-> node3 <-> node2 <-> node4
  //  ^                              ^
  //  |                              |
  // head                           tail

  list.splice(node, node3);
  expectOrder(t, list, [node, node3, node2, node4]);

  t.end();
});

test('DoublyLinkedList#insert', t => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  const node3 = list.add(3);
  const node4 = list.add(4);

  // Before:
  //
  //  node <-> node2 <-> node3 <-> node4
  //  ^                   ^         ^
  //  |                   |         |
  // head/node        nextNode      tail

  // After:
  //
  //  node <-> node3 <-> node2 <-> node4
  //  ^                              ^
  //  |                              |
  // head                           tail

  list.splice(node, node3);
  expectOrder(t, list, [node, node3, node2, node4]);

  t.end();
});
