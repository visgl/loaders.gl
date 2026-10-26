// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTF} from '../types/gltf-types';

/** Attach fully detached, non-renderable skeleton hierarchies to scenes using their skins. */
export function convertGLTFV1SkinScenes(
  json: GLTF,
  reportUnsupported: (feature: string) => void,
  reportNote: (message: string) => void
): void {
  const nodes = json.nodes || [];
  const parents = new Map<number, number | null>();
  for (const [parentIndex, node] of nodes.entries())
    for (const childIndex of node.children || []) {
      parents.set(childIndex, parents.has(childIndex) ? null : parentIndex);
    }
  const plans: Array<() => void> = [];
  for (const [sceneIndex, scene] of (json.scenes || []).entries()) {
    const reachable = collectNodes(scene.nodes || []);
    if (!reachable) {
      reportUnsupported(`scene ${sceneIndex} invalid node hierarchy`);
      continue;
    }
    for (const nodeIndex of Array.from(reachable)) {
      const skin = json.skins?.[nodes[nodeIndex].skin as number];
      if (!Array.isArray(skin?.joints) || !skin.joints.length || skin.skeleton === undefined)
        continue;
      if (
        reachable.has(skin.skeleton) &&
        skin.joints.every(jointIndex => reachable.has(jointIndex))
      )
        continue;
      let rootIndex = skin.skeleton;
      const ancestors = new Set<number>();
      while (!ancestors.has(rootIndex) && typeof parents.get(rootIndex) === 'number') {
        ancestors.add(rootIndex);
        rootIndex = parents.get(rootIndex) as number;
      }
      const hierarchy = collectNodes([rootIndex]);
      if (
        ancestors.has(rootIndex) ||
        parents.get(rootIndex) === null ||
        !hierarchy ||
        !skin.joints.every(jointIndex => hierarchy.has(jointIndex)) ||
        Array.from(hierarchy).some(
          index =>
            reachable.has(index) ||
            nodes[index].mesh !== undefined ||
            nodes[index].camera !== undefined ||
            nodes[index].extensions !== undefined
        )
      ) {
        reportUnsupported(
          `scene ${sceneIndex} skin ${nodes[nodeIndex].skin} cannot safely attach detached skeleton`
        );
        continue;
      }
      for (const index of hierarchy) reachable.add(index);
      plans.push(() => {
        scene.nodes ||= [];
        scene.nodes.push(rootIndex);
        reportNote(`Attached detached skeleton root ${rootIndex} to scene ${sceneIndex}.`);
      });
    }
  }
  for (const apply of plans) apply();

  /** Traverse a forest while detecting missing nodes, cycles, and repeated paths. */
  function collectNodes(roots: number[]): Set<number> | null {
    const visited = new Set<number>();
    const pending = [...roots];
    while (pending.length) {
      const index = pending.pop()!;
      if (
        !Number.isSafeInteger(index) ||
        !nodes[index] ||
        visited.has(index) ||
        parents.get(index) === null
      )
        return null;
      visited.add(index);
      pending.push(...(nodes[index].children || []));
    }
    return visited;
  }
}
