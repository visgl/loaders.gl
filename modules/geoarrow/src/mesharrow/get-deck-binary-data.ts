// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray} from '@math.gl/types';
import {getFloat16Value} from '@loaders.gl/schema';
import {getSizeAndValueFromMeshArrowVector} from './mesh-accessors';
import * as arrow from 'apache-arrow';

/**  */
export type DeckBinaryData = {
  length: number;
  attributes: Record<
    string,
    {
      value: TypedArray;
      size: number;
    }
  >;
};

/**  */
export function getDeckBinaryDataFromArrowMesh(table: arrow.Table): DeckBinaryData {
  const positionVector = table.getChild('POSITION');
  if (!positionVector) {
    throw new Error('POSITION attribute not found');
  }

  const getPosition = getSizeAndValueFromMeshArrowVector(positionVector);

  const deckAttributes: DeckBinaryData['attributes'] = {
    getPosition
  };

  const colorVector = table.getChild('COLOR_0');
  if (colorVector) {
    deckAttributes.getColor = getDeckColorAttribute(colorVector);
  }
  // Check PointCloudLayer docs for other supported props?
  return {
    length: table.numRows,
    attributes: deckAttributes
  };
}

/** Convert normalized floating-point Arrow colors to deck.gl's byte color convention. */
function getDeckColorAttribute(attributeVector: arrow.Vector): {size: number; value: TypedArray} {
  const attribute = getSizeAndValueFromMeshArrowVector(attributeVector);
  const isNormalizedFloat =
    attributeVector.type instanceof arrow.Float16 ||
    attributeVector.type instanceof arrow.Float32 ||
    (attributeVector.type instanceof arrow.FixedSizeList &&
      (attributeVector.type.children[0].type instanceof arrow.Float16 ||
        attributeVector.type.children[0].type instanceof arrow.Float32));
  if (!isNormalizedFloat) {
    return attribute;
  }

  const byteColors = new Uint8Array(attribute.value.length);
  for (let index = 0; index < attribute.value.length; index++) {
    const color =
      attributeVector.type instanceof arrow.Float16 ||
      (attributeVector.type instanceof arrow.FixedSizeList &&
        attributeVector.type.children[0].type instanceof arrow.Float16)
        ? getFloat16Value(attribute.value as Uint16Array, index)
        : attribute.value[index];
    byteColors[index] = Math.round(Math.max(0, Math.min(1, color)) * 255);
  }
  return {size: attribute.size, value: byteColors};
}
