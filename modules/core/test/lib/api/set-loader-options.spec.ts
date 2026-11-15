// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {setLoaderOptions, getLoaderOptions, compareLoaderOptions} from '@loaders.gl/core';
test('setLoaderOptions', () => {
  setLoaderOptions({});
});
test('getLoaderOptions', () => {
  const options1 = getLoaderOptions();
  expect(options1.customOption).toBeFalsy();
  setLoaderOptions({
    customOption: 'customValue'
  });
  const options2 = getLoaderOptions();
  expect(options2.customOption).toBe('customValue');
});

test('compareLoaderOptions compares nested options and ordered arrays', () => {
  const options = {core: {worker: false}, json: {paths: ['first', 'second']}};
  expect(
    compareLoaderOptions(options, {json: {paths: ['first', 'second']}, core: {worker: false}})
  ).toBe(true);
  expect(compareLoaderOptions(options, {...options, json: {paths: ['second', 'first']}})).toBe(
    false
  );
  expect(compareLoaderOptions(undefined, undefined)).toBe(true);
  expect(compareLoaderOptions(undefined, {})).toBe(false);
  expect(compareLoaderOptions({json: {path: undefined}}, {json: {other: undefined}})).toBe(false);
});

test('compareLoaderOptions compares callbacks and signals by reference', () => {
  const onProgress = () => {};
  const signal = new AbortController().signal;
  const options = {onProgress, signal, json: {onValue: onProgress}};
  expect(compareLoaderOptions(options, {...options, json: {onValue: onProgress}})).toBe(true);
  expect(compareLoaderOptions(options, {...options, json: {onValue: () => {}}})).toBe(false);
  expect(compareLoaderOptions(options, {...options, signal: new AbortController().signal})).toBe(
    false
  );
});

test('compareLoaderOptions compares cyclic objects and preserves array lengths', () => {
  const left = {json: {items: Array(1), self: {}}};
  const right = {json: {items: Array(1), self: {}}};
  left.json.self = left;
  right.json.self = right;
  expect(compareLoaderOptions(left, right)).toBe(true);
  right.json.items.length = 2;
  expect(compareLoaderOptions(left, right)).toBe(false);
});
