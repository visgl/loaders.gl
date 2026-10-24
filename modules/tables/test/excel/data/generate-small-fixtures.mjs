#!/usr/bin/env node

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {read, utils, writeFile} from 'xlsx';

const fixtureDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceWorkbook = read(path.join(fixtureDirectory, 'zipcodes.csv'), {type: 'file'});
const sourceWorksheet = sourceWorkbook.Sheets[sourceWorkbook.SheetNames[0]];
const rows = utils.sheet_to_json(sourceWorksheet).slice(0, 12);
const workbook = utils.book_new();
utils.book_append_sheet(workbook, utils.json_to_sheet(rows), 'zipcodes');
workbook.Props = {
  Title: 'Deterministic loaders.gl Excel test fixture',
  CreatedDate: new Date('2020-01-01T00:00:00.000Z'),
  ModifiedDate: new Date('2020-01-01T00:00:00.000Z')
};

writeFile(workbook, path.join(fixtureDirectory, 'zipcodes-small.csv'), {bookType: 'csv'});
writeFile(workbook, path.join(fixtureDirectory, 'zipcodes-small.xlsx'), {
  bookType: 'xlsx',
  compression: true
});
writeFile(workbook, path.join(fixtureDirectory, 'zipcodes-small.xlsb'), {
  bookType: 'xlsb',
  compression: true
});
