// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTF, GLTFNode, GLTFSkin} from '../types/gltf-types';

/** Legacy node fields used to resolve one skin instance. */
type LegacyNode = GLTFNode & {
  /** Symbolic name referenced by a glTF 1 skin. */
  jointName?: string;
  /** Root node IDs selecting this instance's skeleton hierarchy. */
  skeletons?: string[];
};

/** Legacy skin fields, before joint names become node indices. */
type LegacySkin = Omit<GLTFSkin, 'joints'> & {
  /** Ordered symbolic joint names, matching inverse-bind matrix order. */
  jointNames?: string[];
  /** Optional existing joint indices on a hybrid input. */
  joints?: number[];
  /** Matrix to bake into geometry or inverse-bind matrices; absent means identity. */
  bindShapeMatrix?: number[];
};

/** A resolved skin binding for one mesh node, or for an unused skin. */
type SkinInstancePlan = {
  /** Mesh node using this binding, absent for an unused skin. */
  nodeIndex?: number;
  /** Ordered glTF 2 joint node indices. */
  jointIndices: number[];
  /** Explicit skeleton root or the inferred common ancestor. */
  skeletonIndex: number;
};

/**
 * Resolve glTF 1 joint names inside each instance's skeleton hierarchy.
 * Shared skins are cloned when instances use different joint nodes. Non-identity bind shapes
 * remain available for binary baking; unresolved or multiple-root bindings are reported.
 */
export function convertGLTFV1Skins(
  json: GLTF,
  resolveNodeId: (nodeId: string) => number,
  reportUnsupported: (feature: string) => void
): void {
  const nodes = (json.nodes || []) as LegacyNode[];
  const skins = (json.skins || []) as LegacySkin[];
  const originalSkinCount = skins.length;
  let hasUnconvertedSkin = false;

  for (let skinIndex = 0; skinIndex < originalSkinCount; skinIndex++) {
    const skin = skins[skinIndex];
    const jointNames = skin.jointNames;
    if (
      !Array.isArray(jointNames) ||
      jointNames.length === 0 ||
      jointNames.some(name => typeof name !== 'string' || !name) ||
      new Set(jointNames).size !== jointNames.length
    ) {
      reportUnsupported(`skin ${skinIndex} has invalid joint names`);
      hasUnconvertedSkin = true;
      continue;
    }

    const instanceIndices = nodes.flatMap((node, nodeIndex) =>
      node.skin === skinIndex ? [nodeIndex] : []
    );
    const plans = (instanceIndices.length ? instanceIndices : [undefined]).map(nodeIndex =>
      resolveSkinInstance(nodes, jointNames, nodeIndex, resolveNodeId, feature =>
        reportUnsupported(`skin ${skinIndex} ${feature}`)
      )
    );
    const hasFailedPlan = plans.some(plan => !plan);
    hasUnconvertedSkin ||= hasFailedPlan;
    const convertedBindings = new Map<string, number>();

    for (const plan of plans) {
      if (!plan) continue;
      const bindingKey = `${plan.skeletonIndex}:${plan.jointIndices.join(',')}`;
      let convertedSkinIndex = convertedBindings.get(bindingKey);
      if (convertedSkinIndex === undefined) {
        const convertedSkin: LegacySkin = {
          ...skin,
          joints: plan.jointIndices,
          skeleton: plan.skeletonIndex
        };
        delete convertedSkin.jointNames;
        if (skin.bindShapeMatrix !== undefined && isIdentityBindShape(skin.bindShapeMatrix)) {
          delete convertedSkin.bindShapeMatrix;
        }
        if (!hasFailedPlan && convertedBindings.size === 0) {
          convertedSkinIndex = skinIndex;
          skins[skinIndex] = convertedSkin;
        } else {
          delete convertedSkin.id;
          convertedSkinIndex = skins.length;
          skins.push(convertedSkin);
        }
        convertedBindings.set(bindingKey, convertedSkinIndex);
      }
      if (plan.nodeIndex !== undefined) {
        nodes[plan.nodeIndex].skin = convertedSkinIndex;
        delete nodes[plan.nodeIndex].skeletons;
      }
    }
  }
  // Keep symbolic names available when a best-effort result contains an unresolved legacy skin.
  if (!hasUnconvertedSkin) {
    for (const node of nodes) delete node.jointName;
  }
}

/** Resolve ordered names within one explicit root, or uniquely across the document. */
function resolveSkinInstance(
  nodes: LegacyNode[],
  jointNames: string[],
  nodeIndex: number | undefined,
  resolveNodeId: (nodeId: string) => number,
  reportUnsupported: (feature: string) => void
): SkinInstancePlan | null {
  const skeletonIds = nodeIndex === undefined ? undefined : nodes[nodeIndex].skeletons;
  if (skeletonIds !== undefined && (!Array.isArray(skeletonIds) || skeletonIds.length > 1)) {
    reportUnsupported('requires one skeleton root per instance');
    return null;
  }
  const explicitRoot = skeletonIds?.length ? resolveNodeId(skeletonIds[0]) : undefined;
  const candidates =
    explicitRoot === undefined
      ? nodes.map((node, candidateIndex) => candidateIndex)
      : collectSkeletonNodes(nodes, explicitRoot);
  const jointIndices: number[] = [];
  const namedCandidates = new Map<string, number[]>();
  for (const candidateIndex of candidates) {
    const jointName = nodes[candidateIndex].jointName;
    if (jointName === undefined) continue;
    const matches = namedCandidates.get(jointName) || [];
    matches.push(candidateIndex);
    namedCandidates.set(jointName, matches);
  }
  for (const jointName of jointNames) {
    const matches = namedCandidates.get(jointName) || [];
    if (matches.length !== 1) {
      reportUnsupported(`cannot uniquely resolve joint ${jointName}`);
      return null;
    }
    jointIndices.push(matches[0]);
  }
  const commonRoot = findCommonJointRoot(nodes, jointIndices);
  if (commonRoot === undefined) {
    reportUnsupported('joints have no unambiguous common hierarchy root');
    return null;
  }
  return {nodeIndex, jointIndices, skeletonIndex: explicitRoot ?? commonRoot};
}

/** Collect descendants iteratively, bounding traversal even for malformed cyclic hierarchies. */
function collectSkeletonNodes(nodes: LegacyNode[], rootIndex: number): number[] {
  const visited = new Set<number>();
  const pending = [rootIndex];
  while (pending.length) {
    const nodeIndex = pending.pop()!;
    if (visited.has(nodeIndex)) continue;
    visited.add(nodeIndex);
    pending.push(...(nodes[nodeIndex].children || []));
  }
  return Array.from(visited);
}

/** Find the closest common ancestor, rejecting cycles and multiply-parented node graphs. */
function findCommonJointRoot(nodes: LegacyNode[], jointIndices: number[]): number | undefined {
  const parents = new Map<number, number>();
  for (const [nodeIndex, node] of nodes.entries()) {
    for (const childIndex of node.children || []) {
      if (parents.has(childIndex) && parents.get(childIndex) !== nodeIndex) return undefined;
      parents.set(childIndex, nodeIndex);
    }
  }
  const ancestorPaths = jointIndices.map(jointIndex => {
    const path: number[] = [];
    const visited = new Set<number>();
    let ancestorIndex: number | undefined = jointIndex;
    while (ancestorIndex !== undefined) {
      if (visited.has(ancestorIndex)) return [];
      visited.add(ancestorIndex);
      path.push(ancestorIndex);
      ancestorIndex = parents.get(ancestorIndex);
    }
    return path;
  });
  const ancestorSets = ancestorPaths.map(path => new Set(path));
  return ancestorPaths[0].find(ancestorIndex =>
    ancestorSets.every(ancestors => ancestors.has(ancestorIndex))
  );
}

/** Check exact identity; even small non-identity values require actual matrix baking. */
function isIdentityBindShape(matrix: number[]): boolean {
  return (
    Array.isArray(matrix) &&
    matrix.length === 16 &&
    Array.from(matrix).every((value, index) => value === (index % 5 === 0 ? 1 : 0))
  );
}
