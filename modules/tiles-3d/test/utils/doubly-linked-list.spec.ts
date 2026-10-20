import {expect, test} from 'vitest';
import {DoublyLinkedList} from '../../src/utils/doubly-linked-list';
function expectOrder(list, nodes) {
  // Assumes at least one node is in the list
  const length = nodes.length;
  expect(list.length).toBe(length);
  // Verify head and tail pointers
  expect(list.head).toBe(nodes[0]);
  expect(list.tail).toBe(nodes[length - 1]);
  // Verify that linked list has nodes in the expected order
  let node = list.head;
  for (let i = 0; i < length; ++i) {
    const nextNode = i === length - 1 ? null : nodes[i + 1];
    const previousNode = i === 0 ? null : nodes[i - 1];
    expect(node).toBe(nodes[i]);
    expect(node.next).toBe(nextNode);
    expect(node.previous).toBe(previousNode);
    node = node.next;
  }
}
test('DoublyLinkedList#constructs', () => {
  const list = new DoublyLinkedList();
  expect(list.head).toBe(null);
  expect(list.head).toBe(null);
  expect(list.length).toBe(0);
});
// eslint-disable-next-line max-statements
test('DoublyLinkedList#adds items', () => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  //   node
  //  ^     ^
  //  |     |
  // head  tail
  expect(list.head).toBe(node);
  expect(list.tail).toBe(node);
  expect(list.length).toBe(1);
  expect(node).toBeTruthy();
  expect(node.item).toBe(1);
  expect(node.previous).toBeFalsy();
  expect(node.next).toBeFalsy();
  const node2 = list.add(2);
  //  node <-> node2
  //  ^         ^
  //  |         |
  // head      tail
  expect(list.head).toBe(node);
  expect(list.tail).toBe(node2);
  expect(list.length).toBe(2);
  expect(node2).toBeTruthy();
  expect(node2.item).toBe(2);
  expect(node2.previous).toBe(node);
  expect(node2.next).toBeFalsy();
  expect(node.next).toBe(node2);
  const node3 = list.add(3);
  //  node <-> node2 <-> node3
  //  ^                    ^
  //  |                    |
  // head                 tail
  expect(list.head).toBe(node);
  expect(list.tail).toBe(node3);
  expect(list.length).toBe(3);
  expect(node3).toBeTruthy();
  expect(node3.item).toBe(3);
  expect(node3.previous).toBe(node2);
  expect(node3.next).toBeFalsy();
  expect(node2.next).toBe(node3);
});
test('DoublyLinkedList#removes from a list with one item', () => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  list.remove(node);
  expect(list.head).toBeFalsy();
  expect(list.tail).toBeFalsy();
  expect(list.length).toBe(0);
});
test('DoublyLinkedList#removes head of list', () => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  list.remove(node);
  expect(list.head).toBe(node2);
  expect(list.tail).toBe(node2);
  expect(list.length).toBe(1);
});
test('DoublyLinkedList#removes tail of list', () => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  list.remove(node2);
  expect(list.head).toBe(node);
  expect(list.tail).toBe(node);
  expect(list.length).toBe(1);
});
test('DoublyLinkedList#removes middle of list', () => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  const node2 = list.add(2);
  const node3 = list.add(3);
  list.remove(node2);
  expect(list.head).toBe(node);
  expect(list.tail).toBe(node3);
  expect(list.length).toBe(2);
});
test('DoublyLinkedList#removes nothing', () => {
  const list = new DoublyLinkedList();
  const node = list.add(1);
  // @ts-ignore
  list.remove();
  expect(list.head).toBe(node);
  expect(list.tail).toBe(node);
  expect(list.length).toBe(1);
});
test('DoublyLinkedList#splices nextNode before node', () => {
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
  expectOrder(list, [node, node3, node4, node2, node5]);
});
test('DoublyLinkedList#splices nextNode after node', () => {
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
  expectOrder(list, [node, node2, node4, node3, node5]);
});
test('DoublyLinkedList#splices nextNode immediately before node', () => {
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
  expectOrder(list, [node, node3, node2, node4]);
});
test('DoublyLinkedList#splices nextNode immediately after node', () => {
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
  expectOrder(list, [node, node2, node3, node4]);
});
test('DoublyLinkedList#splices node === nextNode', () => {
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
  expectOrder(list, [node, node2, node3]);
});
test('DoublyLinkedList#splices when nextNode was tail', () => {
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
  expectOrder(list, [node, node2, node4, node3]);
});
test('DoublyLinkedList#splices when node was tail', () => {
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
  expectOrder(list, [node, node3, node4, node2]);
});
test('DoublyLinkedList#splices when nextNode was head', () => {
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
  expectOrder(list, [node2, node3, node, node4]);
});
test('DoublyLinkedList#splices when node was head', () => {
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
  expectOrder(list, [node, node3, node2, node4]);
});
test('DoublyLinkedList#insert', () => {
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
  expectOrder(list, [node, node3, node2, node4]);
});
