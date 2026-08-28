// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Aggregation operation supported by the SceneServer client helper. */
export type ArcGISSceneAggregationOperation = 'count' | 'sum' | 'min' | 'max' | 'average';

/** A single aggregation specification. */
export type ArcGISSceneAggregationSpec = {
  /** Output field name. */
  name: string;
  /** Input property used by numeric operations. */
  field?: string;
  /** Operation to apply. */
  operation: ArcGISSceneAggregationOperation;
};

/** Options for deterministic client-side feature aggregation. */
export type ArcGISSceneAggregationOptions = {
  /** Features represented as ArcGIS feature objects or plain attribute records. */
  features: unknown[];
  /** Optional property used to create groups. */
  groupBy?: string;
  /** Aggregations to compute for each group. */
  aggregations: ArcGISSceneAggregationSpec[];
};

/** Result of one group in a client-side aggregation. */
export type ArcGISSceneAggregationGroup = {
  /** Group key, or `undefined` when no grouping was requested. */
  group: unknown;
  /** Aggregated values keyed by specification name. */
  values: Record<string, number>;
};

/**
 * Aggregates SceneServer features without evaluating renderer or Arcade expressions.
 * Missing and non-numeric values are ignored by numeric operations; `count` counts
 * records regardless of field presence.
 */
export function aggregateArcGISSceneFeatures(
  options: ArcGISSceneAggregationOptions
): ArcGISSceneAggregationGroup[] {
  const groups = new Map<unknown, unknown[]>();
  for (const feature of options.features) {
    const attributes = getFeatureAttributes(feature);
    const key = options.groupBy ? attributes[options.groupBy] : undefined;
    const group = groups.get(key);
    if (group) group.push(feature);
    else groups.set(key, [feature]);
  }

  return [...groups.entries()].map(([group, features]) => ({
    group,
    values: Object.fromEntries(
      options.aggregations.map(spec => [spec.name, aggregateValues(features, spec)])
    )
  }));
}

function aggregateValues(features: unknown[], specification: ArcGISSceneAggregationSpec): number {
  if (specification.operation === 'count') return features.length;
  const values = features
    .map(feature => getFeatureAttributes(feature)[specification.field || ''])
    .map(value => (typeof value === 'number' ? value : Number(value)))
    .filter(Number.isFinite);
  if (!values.length) return 0;
  switch (specification.operation) {
    case 'sum':
      return values.reduce((sum, value) => sum + value, 0);
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'average':
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    default:
      return 0;
  }
}

function getFeatureAttributes(feature: unknown): Record<string, unknown> {
  if (!feature || typeof feature !== 'object') return {};
  const candidate = feature as {attributes?: unknown};
  if (candidate.attributes && typeof candidate.attributes === 'object') {
    return candidate.attributes as Record<string, unknown>;
  }
  return feature as Record<string, unknown>;
}
