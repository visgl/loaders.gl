// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {get3DTilesSpatialReference, getI3SSpatialReference} from '@loaders.gl/tiles';

describe('getI3SSpatialReference', () => {
  test('prefers current horizontal and vertical WKIDs and preserves I3S wire order', () => {
    const spatialReference = getI3SSpatialReference({
      spatialReference: {
        wkid: 102100,
        latestWkid: 3857,
        vcsWkid: 105703,
        latestVcsWkid: 5703
      },
      heightModelInfo: {
        heightModel: 'gravity_related_height',
        vertCRS: 'EPSG:5703'
      }
    });

    expect(spatialReference).toMatchObject({
      sourceCrs: 'EPSG:3857',
      verticalCrs: 'EPSG:5703',
      heightReference: 'orthometric',
      coordinateFrame: 'projected',
      axisOrder: 'xyz',
      provenance: 'metadata'
    });
  });

  test('uses custom WKT and reports terrain-dependent elevation placement', () => {
    const spatialReference = getI3SSpatialReference({
      spatialReference: {wkt: 'PROJCS["Custom"]'},
      elevationInfo: {mode: 'relativeToGround'}
    });

    expect(spatialReference.sourceCrs).toBe('PROJCS["Custom"]');
    expect(spatialReference.warnings[0]).toContain(
      'requires a terrain or scene elevation provider'
    );
  });
});

describe('get3DTilesSpatialReference', () => {
  test('resolves geocentric CRS and epoch through structured metadata semantics', () => {
    const spatialReference = get3DTilesSpatialReference({
      schema: {
        classes: {
          tileset: {
            properties: {
              crs: {semantic: 'TILESET_CRS_GEOCENTRIC'},
              epoch: {semantic: 'TILESET_CRS_COORDINATE_EPOCH'}
            }
          }
        }
      },
      metadata: {
        class: 'tileset',
        properties: {crs: 'EPSG:4978', epoch: 2020.25}
      }
    });

    expect(spatialReference).toMatchObject({
      sourceCrs: 'EPSG:4978',
      coordinateEpoch: 2020.25,
      coordinateFrame: 'geocentric',
      heightReference: 'ellipsoidal',
      provenance: 'metadata'
    });
  });

  test('keeps an explicitly unknown geocentric CRS unresolved', () => {
    const spatialReference = get3DTilesSpatialReference({
      schema: {
        classes: {
          tileset: {
            properties: {crs: {semantic: 'TILESET_CRS_GEOCENTRIC'}}
          }
        }
      },
      metadata: {class: 'tileset', properties: {crs: 'UNKNOWN'}},
      root: {boundingVolume: {region: [0, 0, 1, 1, 0, 1]}}
    });

    expect(spatialReference.sourceCrs).toBeUndefined();
    expect(spatialReference.provenance).toBe('unknown');
    expect(spatialReference.warnings).toContain('3D Tiles geocentric CRS is explicitly unknown');
  });

  test('uses the specification frame established by a root region', () => {
    const spatialReference = get3DTilesSpatialReference({
      root: {boundingVolume: {region: [0, 0, 1, 1, 0, 1]}}
    });

    expect(spatialReference).toMatchObject({
      sourceCrs: 'EPSG:4978',
      provenance: 'format-default'
    });
  });

  test('does not infer ECEF for an unlabelled local tileset', () => {
    const spatialReference = get3DTilesSpatialReference({root: {boundingVolume: {}}});

    expect(spatialReference.sourceCrs).toBeUndefined();
    expect(spatialReference.coordinateFrame).toBe('unknown');
  });
});
