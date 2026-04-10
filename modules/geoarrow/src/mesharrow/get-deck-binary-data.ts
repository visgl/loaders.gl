// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TypedArray} from '@math.gl/types';
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
    deckAttributes.getColor = getSizeAndValueFromMeshArrowVector(colorVector);
  }
  // Check PointCloudLayer docs for other supported props?
  return {
    length: table.numRows,
    attributes: deckAttributes
  };
}
