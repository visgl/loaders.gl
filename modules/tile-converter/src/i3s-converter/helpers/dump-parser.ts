import {isMap} from 'util/types';

/**
 * Convert dump map to object for stringifying to JSON
 * @param tilesConverted - Map of tilesConverted with conversion status
 * @returns tilesConverted Map converted to Object
 */
export const dumpTilesToObject = (tilesConverted: Map<string, any>) => {
  const object = {};
  for (const [key, value] of tilesConverted) {
    if (value?.nodes) {
      object[key] = {nodes: []};
      for (const node of value.nodes) {
        if (isMap(node.done)) {
          object[key].nodes.push({nodeId: node.nodeId, done: Object.fromEntries(node.done)});
        } else {
          object[key].nodes.push({nodeId: node.nodeId, done: node.done});
        }
      }
    }
  }
  return object;
};
