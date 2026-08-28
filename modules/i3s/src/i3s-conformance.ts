// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {I3SFeatureSupportStatus} from './i3s-service';

/** I3S layer families covered by the conformance manifest. */
export type I3SConformanceProfile =
  | '3DObject'
  | 'IntegratedMesh'
  | 'Building'
  | 'Point'
  | 'PointCloud';

/** A version/profile fixture and its expected delivery forms. */
export type I3SConformanceManifestEntry = {
  /** Esri community specification version. */
  version: string;
  /** OGC I3S profile mapping, when a normative mapping is available. */
  ogcProfile?: string;
  /** I3S layer family. */
  profile: I3SConformanceProfile;
  /** Workspace-relative representative fixture, when checked in. */
  fixture?: string;
  /** Delivery forms covered by the fixture and tests. */
  resources: readonly ('rest' | 'slpk' | 'gzip')[];
  /** Capability expectations surfaced by the support report. */
  capabilities: Readonly<Record<string, I3SFeatureSupportStatus>>;
  /** Earliest loaders.gl release containing the covered support. */
  since: string;
};

/**
 * Table-driven version/profile coverage used by documentation and conformance tests.
 *
 * A missing fixture is intentional: it prevents the documentation from implying that a
 * profile/version has been exercised when only its schema is known.
 */
export const I3S_CONFORMANCE_MANIFEST: readonly I3SConformanceManifestEntry[] = [
  {
    version: '1.6',
    ogcProfile: 'I3S 1.3 3D Object',
    profile: '3DObject',
    fixture: 'modules/i3s/test/data/SanFrancisco_Bldgs/SceneServer/layers/0',
    resources: ['rest'],
    capabilities: {metadata: 'supported', geometry: 'supported', attributes: 'partial'},
    since: 'v2.0'
  },
  {
    version: '1.7',
    ogcProfile: 'I3S 1.3 3D Object',
    profile: '3DObject',
    fixture: 'modules/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0',
    resources: ['rest'],
    capabilities: {metadata: 'supported', geometry: 'supported', attributes: 'supported'},
    since: 'v2.3'
  },
  {
    version: '1.8',
    ogcProfile: 'I3S 1.3 3D Object',
    profile: '3DObject',
    fixture: 'modules/i3s/test/data/conformance/i3s-1.8-3d-object.json',
    resources: ['rest'],
    capabilities: {metadata: 'supported', geometry: 'supported', attributes: 'supported'},
    since: 'v3.1'
  },
  {
    version: '1.9',
    ogcProfile: 'I3S 1.3 3D Object',
    profile: '3DObject',
    fixture: 'modules/i3s/test/data/conformance/i3s-1.9-3d-object.json',
    resources: ['rest'],
    capabilities: {metadata: 'supported', geometry: 'supported', attributes: 'supported'},
    since: 'v5.0'
  },
  {
    version: '1.10',
    ogcProfile: 'I3S 1.3 3D Object',
    profile: '3DObject',
    fixture: 'modules/i3s/test/data/conformance/i3s-1.10-3d-object.json',
    resources: ['rest'],
    capabilities: {metadata: 'supported', geometry: 'supported', attributes: 'supported'},
    since: 'v5.0'
  },
  {
    version: '1.8',
    ogcProfile: 'I3S 1.3 Integrated Mesh',
    profile: 'IntegratedMesh',
    resources: [],
    capabilities: {metadata: 'supported', geometry: 'partial', attributes: 'unsupported'},
    since: 'v2.0'
  },
  {
    version: '1.8',
    ogcProfile: 'I3S 1.3 Building',
    profile: 'Building',
    resources: [],
    capabilities: {metadata: 'supported', geometry: 'partial', attributes: 'partial'},
    since: 'v3.1'
  },
  ...(['1.7', '1.8', '1.9', '1.10'] as const).map(version => ({
    version,
    ogcProfile: 'I3S 1.3 Point',
    profile: 'Point' as const,
    fixture: version === '1.8' ? 'modules/i3s/test/data/conformance/i3s-1.8-point.json' : undefined,
    resources: version === '1.8' ? (['rest'] as const) : ([] as const),
    capabilities: {
      metadata: 'supported' as const,
      geometry: version === '1.8' ? ('supported' as const) : ('partial' as const),
      attributes: version === '1.8' ? ('supported' as const) : ('partial' as const)
    },
    since: 'v5.0'
  })),
  {
    version: '2.0',
    ogcProfile: 'I3S 1.3 Point Cloud',
    profile: 'PointCloud',
    resources: [],
    capabilities: {metadata: 'supported', geometry: 'partial', attributes: 'partial'},
    since: 'v5.0'
  },
  {
    version: '2.1',
    ogcProfile: 'I3S 1.3 Point Cloud',
    profile: 'PointCloud',
    fixture: 'modules/i3s/test/data/conformance/i3s-2.1-point-cloud.json',
    resources: ['rest'],
    capabilities: {metadata: 'supported', geometry: 'supported', attributes: 'partial'},
    since: 'v5.0'
  }
];
