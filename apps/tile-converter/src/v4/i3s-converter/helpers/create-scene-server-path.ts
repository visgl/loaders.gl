import type {SceneLayer3D} from '@loaders.gl/i3s';
import {randomUUID} from 'node:crypto';
import {join} from 'path';

import {createSceneServer} from '../json-templates/scene-server';
import {writeFile} from '../../lib/utils/file-utils';

/**
 * Form and save sceneServer meta data into a file
 * @param layerName - layer name to display
 * @param layers0 - layer object embedded into sceneServer meta data
 * @param rootPath - root path of new converted tileset
 */
export async function createSceneServerPath(
  layerName: string,
  layers0: SceneLayer3D,
  rootPath: string
): Promise<void> {
  const sceneServerData = {
    serviceItemId: randomUUID().replace(/-/gi, ''),
    layerName,
    layers0
  };

  const sceneServer = createSceneServer(sceneServerData);
  const nodePagePath = join(rootPath, 'SceneServer');
  await writeFile(nodePagePath, JSON.stringify(sceneServer));
}
