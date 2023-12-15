import type {BuildingSceneSublayer} from '@loaders.gl/i3s';

export interface Sublayer extends BuildingSceneSublayer {
  expanded: boolean;
  childNodesCount: number;
  sublayers: Sublayer[] | undefined;
}

/**
 * - deep copy the tree for React
 * - filter "preview" layer
 * - calculate the number of child nodes for each node (just in case)
 * @param {BuildingSceneSublayer[]} sublayers
 * @returns {Sublayer | null}
 */
export function buildSublayersTree(sublayers: BuildingSceneSublayer[]): Sublayer | null {
  const fullModel = sublayers.find((subtree) => subtree.modelName === 'FullModel');
  if (!fullModel) {
    return null;
  }
  const result = postprocessNode(fullModel);
  return result;
}

function postprocessNode(sublayer: BuildingSceneSublayer): Sublayer | null {
  const sublayerCopy: Sublayer = {
    ...sublayer,
    sublayers: undefined,
    expanded: false,
    childNodesCount: 0
  };
  if (sublayer.sublayers?.length) {
    const {childNodesCount, sublayersCopy} = postrocessSublayers(sublayer.sublayers);
    sublayerCopy.sublayers = sublayersCopy;
    sublayerCopy.childNodesCount = childNodesCount;
  } else {
    sublayerCopy.childNodesCount = 0;
    if (sublayer.layerType === 'group') {
      return null;
    }
  }
  return sublayerCopy;
}

function postrocessSublayers(sublayers: BuildingSceneSublayer[]): {
  childNodesCount: number;
  sublayersCopy: Sublayer[];
} {
  const sublayersCopy: Sublayer[] = [];
  let childNodesCount = 0;
  for (const sublayer of sublayers) {
    const sublayerCopy = postprocessNode(sublayer);
    if (!sublayerCopy) {
      continue;
    }
    sublayersCopy.push(sublayerCopy);
    childNodesCount += sublayerCopy.childNodesCount + 1;
  }
  return {childNodesCount, sublayersCopy};
}
