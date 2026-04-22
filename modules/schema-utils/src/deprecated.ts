// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  convertArrowToTable as convertArrowToTableImplementation,
  convertTableToArrow as convertTableToArrowImplementation
} from './lib/table/tables/convert-arrow-table';
import {convertTable as convertTableImplementation} from './lib/table/tables/convert-table';
import {
  convertToArrayRow as convertToArrayRowImplementation,
  convertToObjectRow as convertToObjectRowImplementation
} from './lib/table/tables/row-utils';

/**
 * @deprecated Use `convert(input, targetShape, [TableConverter])` from `@loaders.gl/schema-utils`.
 */
export const convertTable: typeof convertTableImplementation = ((...args) =>
  convertTableImplementation(
    ...(args as Parameters<typeof convertTableImplementation>)
  )) as typeof convertTableImplementation;

/**
 * @deprecated Use `convert(input, 'object-row-table', [TableConverter])` from `@loaders.gl/schema-utils`.
 */
export const convertArrowToTable: typeof convertArrowToTableImplementation = ((...args) =>
  convertArrowToTableImplementation(
    ...(args as Parameters<typeof convertArrowToTableImplementation>)
  )) as typeof convertArrowToTableImplementation;

/**
 * @deprecated Use `convert(input, 'arrow', [TableConverter, ArrowConverter])`.
 */
export const convertTableToArrow: typeof convertTableToArrowImplementation = ((...args) =>
  convertTableToArrowImplementation(
    ...(args as Parameters<typeof convertTableToArrowImplementation>)
  )) as typeof convertTableToArrowImplementation;

/**
 * @deprecated Use `convert(input, 'object-row-table', [TableConverter])` for table conversions.
 */
export const convertToObjectRow: typeof convertToObjectRowImplementation = ((...args) =>
  convertToObjectRowImplementation(
    ...(args as Parameters<typeof convertToObjectRowImplementation>)
  )) as typeof convertToObjectRowImplementation;

/**
 * @deprecated Use `convert(input, 'array-row-table', [TableConverter])` for table conversions.
 */
export const convertToArrayRow: typeof convertToArrayRowImplementation = ((...args) =>
  convertToArrayRowImplementation(
    ...(args as Parameters<typeof convertToArrayRowImplementation>)
  )) as typeof convertToArrayRowImplementation;
