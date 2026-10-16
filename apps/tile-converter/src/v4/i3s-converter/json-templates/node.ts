// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BuilderInput} from '../../lib/utils/builder-input';

import type {BoundingVolumes, NodeReference, Node3DIndexDocument} from '@loaders.gl/i3s';

/** Legacy node documents may include a path in addition to the typed I3S fields. */
type NodeBuilderRecord = Node3DIndexDocument & {
  /** Legacy document path. */
  path?: string;
};

/** Builds coordinates with the legacy field selection and defaults. */
function createCoordinates(input: BuilderInput<BoundingVolumes> | null | undefined) {
  const source = input ?? {};
  return {
    mbs: source.mbs ?? undefined,
    obb: source.obb ?? undefined
  };
}

/** Builds href with the legacy field selection and defaults. */
function createHref(input: BuilderInput<Pick<NodeReference, 'href'>> | null | undefined) {
  const source = input ?? {};
  return {
    href: source.href ?? undefined
  };
}

/** Builds parent node with the legacy field selection and defaults. */
function createParentNode(input: BuilderInput<NodeReference> | null | undefined): NodeReference {
  const source = input ?? {};
  return {
    id: source.id ?? undefined,
    ...createHref(source),
    ...createCoordinates(source)
  } as NodeReference;
}

/** Builds node with the legacy field selection and defaults. */
export function createNode(
  input: BuilderInput<NodeBuilderRecord> | null | undefined
): NodeBuilderRecord {
  const source = input ?? {};
  return {
    version: source.version ?? undefined,
    id: source.id ?? undefined,
    path: source.path ?? undefined,
    level: source.level ?? undefined,
    ...createCoordinates(source),
    lodSelection: source.lodSelection ?? [
      {
        metricType: 'maxScreenThresholdSQ',
        maxError: 196349.54374999998
      },
      {
        metricType: 'maxScreenThreshold',
        maxError: 999.9999999999999
      }
    ],
    children: source.children ?? undefined,
    neighbors: source.neighbors ?? undefined,
    parentNode: createParentNode(source.parentNode) ?? undefined,
    sharedResource: source.sharedResource ?? undefined,
    featureData: source.featureData ?? undefined,
    geometryData: source.geometryData ?? undefined,
    textureData: source.textureData ?? undefined,
    attributeData: source.attributeData ?? undefined
  } as NodeBuilderRecord;
}
