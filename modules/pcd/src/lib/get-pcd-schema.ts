// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Schema, Field} from '@loaders.gl/schema';
import type {PCDHeader} from './pcd-types';

/**
 * Gets schema from PCD header
 * @param PCDheader
 * @param metadata
 * @returns Schema
 */
export function getPCDSchema(
  PCDheader: PCDHeader,
  metadata: Record<string, string>,
  colorFormat: 'uint8norm' | 'float16' | 'float32' = 'uint8norm'
): Schema {
  const fields: Field[] = [];

  for (const key of Object.keys(PCDheader.offset)) {
    switch (key) {
      case 'x':
        fields.push({
          name: 'POSITION',
          type: {type: 'fixed-size-list', listSize: 3, children: [{name: 'xyz', type: 'float32'}]},
          metadata: {attribute: 'POSITION'}
        });
        break;
      case 'y':
      case 'z':
        // ignore
        break;

      case 'normal_x':
        fields.push({
          name: 'NORMAL',
          type: {type: 'fixed-size-list', listSize: 3, children: [{name: 'xyz', type: 'float32'}]},
          metadata: {attribute: 'NORMAL'}
        });
        break;
      case 'normal_y':
      case 'normal_z':
        // ignore
        break;

      case 'rgb':
        const colorType =
          colorFormat === 'float16' ? 'float16' : colorFormat === 'float32' ? 'float32' : 'uint8';
        fields.push({
          name: 'COLOR_0',
          type: {type: 'fixed-size-list', listSize: 3, children: [{name: 'rgb', type: colorType}]},
          metadata: {
            attribute: 'COLOR',
            ...(colorFormat === 'float16' ? {componentType: 'float16'} : {})
          }
        });
        break;

      default:
      // TODO - push fields
    }
  }

  return {fields, metadata};
}
