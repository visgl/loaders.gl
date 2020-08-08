// loaders.gl, MIT license
// Forked from https://github.com/uber-web/type-analyzer under MIT license
// Copyright (c) 2017 Uber Technologies, Inc.

import test from 'tape-promise/tape';
import {computeColumnMetadata} from '@loaders.gl/type-analyzer';

test('computeColumnMetadata: force dimension via rules', (t) => {
  let arr: unknown[] = [];
  const mapArr = function mapArr(d) {
    return {col: d, batmang: d + 1};
  };

  arr = [1, 0, 1, 0, 1, 0].map(mapArr);
  let ruleSet = [{regex: /col/, dataType: 'STRING'}];
  let colMeta = computeColumnMetadata(arr, ruleSet);
  t.equal(colMeta[0].type, 'STRING', 'correctly forces data to be read as strings');
  t.equal(colMeta[1].type, 'INT', 'leaves the non matching column alone and analyzes as normal');

  ruleSet = [{regex: /col/, dataType: 'NUMBER'}];
  colMeta = computeColumnMetadata(arr, ruleSet);
  t.equal(colMeta[0].type, 'NUMBER', 'correctly forces data to be read as numbers');
  t.equal(colMeta[1].type, 'INT', 'leaves the non matching column alone and analyzes as normal');

  ruleSet = [{regex: /col/, dataType: 'BOOLEAN'}];
  colMeta = computeColumnMetadata(arr, ruleSet);
  t.equal(colMeta[0].type, 'BOOLEAN', 'correctly forces data to be read as booleans');
  t.equal(colMeta[1].type, 'INT', 'leaves the non matching column alone and analyzes as normal');

  t.end();
});

test('computeColumnMetadata: force dimension via rules - string match', (t) => {
  let arr: unknown[] = [];
  const mapArr = function mapArr(d) {
    return {col: d, batmang: d + 1};
  };

  arr = [1, 0, 1, 0, 1, 0].map(mapArr);
  let ruleSet = [{name: 'col', dataType: 'STRING'}];
  let colMeta = computeColumnMetadata(arr, ruleSet);
  t.equal(colMeta[0].type, 'STRING', 'correctly forces data to be read as strings');
  t.equal(colMeta[1].type, 'INT', 'leaves the non matching column alone and analyzes as normal');

  ruleSet = [{name: 'col', dataType: 'NUMBER'}];
  colMeta = computeColumnMetadata(arr, ruleSet);
  t.equal(colMeta[0].type, 'NUMBER', 'correctly forces data to be read as numbers');
  t.equal(colMeta[1].type, 'INT', 'leaves the non matching column alone and analyzes as normal');

  ruleSet = [{name: 'col', dataType: 'BOOLEAN'}];
  colMeta = computeColumnMetadata(arr, ruleSet);
  t.equal(colMeta[0].type, 'BOOLEAN', 'correctly forces data to be read as booleans');
  t.equal(colMeta[1].type, 'INT', 'leaves the non matching column alone and analyzes as normal');

  t.end();
});

test('computeColumnMetadata: passing invalid rules', (t) => {
  let arr: unknown[] = [];
  const mapArr = function mapArr(d) {
    return {col: d, batmang: d + 1};
  };

  arr = [1, 0, 1, 0, 1, 0].map(mapArr);
  const ruleSet = [{key: 'col', dataType: 'STRING'}];
  const colMeta = computeColumnMetadata(arr, ruleSet);
  t.equal(colMeta[1].type, 'INT', 'Ignores the invalid rules and analyzes as normal');

  t.end();
});
