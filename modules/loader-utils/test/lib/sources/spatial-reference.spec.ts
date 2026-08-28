// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createSpatialReference, inferSpatialReferenceRepresentation} from '../../../src';

describe('createSpatialReference', () => {
  test('preserves a preferred definition and alternate representation immutably', () => {
    const spatialReference = createSpatialReference({
      crs: {
        state: 'explicit',
        definition: 'GEOGCRS["WGS 84"]',
        representation: 'wkt',
        provenance: 'metadata',
        alternatives: [{definition: 'EPSG:4326', representation: 'identifier'}]
      },
      coordinateEpoch: 2020.25,
      coordinateFrame: 'geographic',
      coordinateOrder: ['x', 'y'],
      units: ['degree', 'degree'],
      heightReference: 'ellipsoidal',
      warnings: ['axis order normalized by the format adapter']
    });

    expect(spatialReference.crs).toEqual({
      state: 'explicit',
      definition: 'GEOGCRS["WGS 84"]',
      representation: 'wkt',
      provenance: 'metadata',
      alternatives: [{definition: 'EPSG:4326', representation: 'identifier'}]
    });
    expect(Object.isFrozen(spatialReference)).toBe(true);
    expect(Object.isFrozen(spatialReference.coordinateOrder)).toBe(true);
    expect(
      spatialReference.crs.state === 'explicit' &&
        Object.isFrozen(spatialReference.crs.alternatives)
    ).toBe(true);
  });

  test('keeps explicit unknown metadata distinct from omitted metadata', () => {
    expect(createSpatialReference({crs: {state: 'unknown', provenance: 'metadata'}}).crs).toEqual({
      state: 'unknown',
      provenance: 'metadata'
    });
    expect(createSpatialReference().crs).toEqual({state: 'absent', provenance: 'unknown'});
  });

  test('clones and freezes a PROJJSON definition', () => {
    const definition = {
      type: 'GeographicCRS',
      name: 'WGS 84',
      coordinate_system: {subtype: 'ellipsoidal', axis: [{name: 'Latitude'}]}
    };
    const spatialReference = createSpatialReference({
      crs: {
        state: 'explicit',
        definition: definition as never,
        representation: 'projjson',
        provenance: 'metadata'
      }
    });

    expect(
      spatialReference.crs.state === 'explicit' && spatialReference.crs.definition !== definition
    ).toBe(true);
    expect(
      spatialReference.crs.state === 'explicit' &&
        typeof spatialReference.crs.definition === 'object' &&
        Object.isFrozen(spatialReference.crs.definition.coordinate_system?.axis)
    ).toBe(true);
  });

  test('rejects a non-finite coordinate epoch', () => {
    expect(() => createSpatialReference({coordinateEpoch: Number.NaN})).toThrow(
      'finite decimal year'
    );
  });
});

describe('inferSpatialReferenceRepresentation', () => {
  test.each([
    ['EPSG:4326', 'identifier'],
    ['GEOGCRS["WGS 84"]', 'wkt'],
    ['PROJCS("Vendor form")', 'wkt'],
    ['+proj=longlat +datum=WGS84', 'proj-string']
  ] as const)('classifies %s as %s', (definition, representation) => {
    expect(inferSpatialReferenceRepresentation(definition)).toBe(representation);
  });

  test('classifies object definitions as PROJJSON', () => {
    expect(
      inferSpatialReferenceRepresentation({type: 'GeographicCRS', name: 'WGS 84'} as never)
    ).toBe('projjson');
  });
});
