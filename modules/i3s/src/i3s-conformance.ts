// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {I3SFeatureSupportStatus} from './i3s-service';

/** A declarative I3S profile/version conformance entry. */
export type I3SConformanceProfile = {
  /** Esri community specification version. */
  version: string;
  /** OGC profile version when the mapping is published. */
  ogcVersion?: string;
  /** I3S layer profile. */
  profile: '3DObject' | 'IntegratedMesh' | 'Building' | 'Point' | 'PointCloud';
  /** Resource delivery forms covered by fixtures. */
  resources: Array<'rest' | 'slpk' | 'gzip'>;
  /** Capability statuses asserted by the fixture suite. */
  capabilities: Record<string, I3SFeatureSupportStatus>;
  /** Earliest loaders.gl release containing the tested support. */
  since?: string;
};

/**
 * Current conformance matrix. OGC 1.3 is the current community-standard mapping;
 * entries without a normative fixture are intentionally omitted rather than claimed.
 */
export const I3S_CONFORMANCE_PROFILES: readonly I3SConformanceProfile[] = [
  ...(['1.6', '1.7', '1.8', '1.9', '1.10'] as const).flatMap(version => [
    {
      version,
      ogcVersion: version === '1.7' || version === '1.8' ? '1.3' : undefined,
      profile: '3DObject' as const,
      resources: ['rest', 'slpk', 'gzip'] as Array<'rest' | 'slpk' | 'gzip'>,
      capabilities: {
        geometry: version === '1.6' ? 'partial' : 'supported',
        attributes: version === '1.6' ? 'partial' : 'supported'
      } as Record<string, I3SFeatureSupportStatus>,
      since: version === '1.6' ? '2.0' : '5.0'
    },
    {
      version,
      ogcVersion: version === '1.7' ? '1.3' : undefined,
      profile: 'Point' as const,
      resources: ['rest', 'slpk'] as Array<'rest' | 'slpk' | 'gzip'>,
      capabilities: {
        geometry: version === '1.6' ? 'unsupported' : 'supported',
        attributes: version === '1.6' ? 'unsupported' : 'supported',
        rendererMetadata: version === '1.6' ? 'unsupported' : 'partial'
      } as Record<string, I3SFeatureSupportStatus>,
      since: '5.0'
    },
    {
      version,
      ogcVersion: version === '1.7' ? '1.3' : undefined,
      profile: 'Building' as const,
      resources: ['rest', 'slpk'] as Array<'rest' | 'slpk' | 'gzip'>,
      capabilities: {
        sublayers: version === '1.6' ? 'unsupported' : 'supported',
        filters: version === '1.6' ? 'unsupported' : 'partial'
      } as Record<string, I3SFeatureSupportStatus>,
      since: '5.0'
    }
  ]),
  {
    version: '2.0',
    ogcVersion: '1.3',
    profile: 'PointCloud',
    resources: ['rest', 'slpk', 'gzip'] as Array<'rest' | 'slpk' | 'gzip'>,
    capabilities: {geometry: 'supported', attributes: 'partial', lepcc: 'supported'},
    since: '5.0'
  },
  {
    version: '2.1',
    ogcVersion: '1.3',
    profile: 'PointCloud',
    resources: ['rest', 'slpk', 'gzip'] as Array<'rest' | 'slpk' | 'gzip'>,
    capabilities: {geometry: 'supported', attributes: 'partial', lepcc: 'supported'},
    since: '5.0'
  }
] as I3SConformanceProfile[];
