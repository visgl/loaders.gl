// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// Forked from https://github.com/mapbox/vt-pbf under MIT License Copyright (c) 2015 Anand Thakker

import Protobuf from 'pbf';
import type {MVTTile, MVTLayer} from './mvt-types';
import * as MVT from './mvt-constants';

export function writeMVT(tile: MVTTile, pbf?: Protobuf): void {
  for (const key in tile.layers) {
    pbf!.writeMessage(MVT.TileInfo.layers, writeLayer, tile.layers[key]);
  }
}

function writeLayer(layer: MVTLayer, pbf?: Protobuf): void {
  pbf!.writeVarintField(MVT.LayerInfo.version, layer.version || 1);
  pbf!.writeStringField(MVT.LayerInfo.name, layer.name || '');
  pbf!.writeVarintField(MVT.LayerInfo.extent, layer.extent || 4096);

  const context = {
    keys: [],
    values: [],
    keycache: {},
    valuecache: {}
  };

  // TODO
  // for (let i = 0; i < layer.length; i++) {
  //   context.feature = layer.feature(i);
  //   pbf!.writeMessage(2, writeFeature, context);
  // }

  const keys = context.keys;
  for (let i = 0; i < keys.length; i++) {
    pbf!.writeStringField(3, keys[i]);
  }

  const values = context.values;
  for (let i = 0; i < values.length; i++) {
    pbf!.writeMessage(4, writeValue, values[i]);
  }
}

// function writeFeature(context, pbf?: Protobuf): void {
//   const feature = context.feature;

//   if (feature.id !== undefined) {
//     pbf!.writeVarintField(1, feature.id);
//   }

//   pbf!.writeMessage(2, writeProperties, context);
//   pbf!.writeVarintField(3, feature.type);
//   pbf!.writeMessage(4, writeGeometry, feature);
// }

// function writeProperties(context, pbf?: Protobuf): void {
//   const feature = context.feature;
//   const keys = context.keys;
//   const values = context.values;
//   const keycache = context.keycache;
//   const valuecache = context.valuecache;

//   for (const key in feature.properties) {
//     let keyIndex = keycache[key];
//     if (typeof keyIndex === 'undefined') {
//       keys.push(key);
//       keyIndex = keys.length - 1;
//       keycache[key] = keyIndex;
//     }
//     pbf!.writeVarint(keyIndex);

//     let value = feature.properties[key];
//     const type = typeof value;
//     if (type !== 'string' && type !== 'boolean' && type !== 'number') {
//       value = JSON.stringify(value);
//     }
//     const valueKey = `${type}:${value}`;
//     let valueIndex = valuecache[valueKey];
//     if (typeof valueIndex === 'undefined') {
//       values.push(value);
//       valueIndex = values.length - 1;
//       valuecache[valueKey] = valueIndex;
//     }
//     pbf!.writeVarint(valueIndex);
//   }
// }

// function command(cmd, length) {
//   return (length << 3) + (cmd & 0x7);
// }

// function zigzag(num) {
//   return (num << 1) ^ (num >> 31);
// }

// function writeGeometry(feature, pbf?: Protobuf): void {
//   const geometry = feature.loadGeometry();
//   const type = feature.type;
//   let x = 0;
//   let y = 0;
//   const rings = geometry.length;
//   for (let r = 0; r < rings; r++) {
//     const ring = geometry[r];
//     let count = 1;
//     if (type === 1) {
//       count = ring.length;
//     }
//     pbf!.writeVarint(command(1, count)); // moveto
//     // do not write polygon closing path as lineto
//     const lineCount = type === 3 ? ring.length - 1 : ring.length;
//     for (let i = 0; i < lineCount; i++) {
//       if (i === 1 && type !== 1) {
//         pbf!.writeVarint(command(2, lineCount - 1)); // lineto
//       }
//       const dx = ring[i].x - x;
//       const dy = ring[i].y - y;
//       pbf!.writeVarint(zigzag(dx));
//       pbf!.writeVarint(zigzag(dy));
//       x += dx;
//       y += dy;
//     }
//     if (type === 3) {
//       pbf!.writeVarint(command(7, 1)); // closepath
//     }
//   }
// }

function writeValue(value: unknown, pbf?: Protobuf): void {
  switch (typeof value) {
    case 'string':
      pbf!.writeStringField(1, value);
      break;
    case 'boolean':
      pbf!.writeBooleanField(7, value);
      break;
    case 'number':
      if (value % 1 !== 0) {
        pbf!.writeDoubleField(3, value);
      } else if (value < 0) {
        pbf!.writeSVarintField(6, value);
      } else {
        pbf!.writeVarintField(5, value);
      }
      break;
    default:
    // ignore
  }
}
