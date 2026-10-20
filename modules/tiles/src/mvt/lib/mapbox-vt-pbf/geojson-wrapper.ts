// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// Forked from https://github.com/mapbox/vt-pbf under MIT License Copyright (c) 2015 Anand Thakker

class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// conform to vectortile api
export default class GeoJSONWrapper {
  options;
  features: any[];
  length: number;

  constructor(features, options = {}) {
    this.options = options;
    this.features = features;
    this.length = features.length;
  }

  feature(index) {
    return new FeatureWrapper(this.features[index], this.options.extent);
  }
}

class FeatureWrapper {
  id;
  type;
  rawGeometry: any;
  properties;
  extent;
  geometry: Point[][] = [];

  constructor(feature, extent) {
    this.id = typeof feature.id === 'number' ? feature.id : undefined;
    this.type = feature.type;
    this.rawGeometry = feature.type === 1 ? [feature.geometry] : feature.geometry;
    this.properties = feature.tags;
    this.extent = extent || 4096;
  }

  loadGeometry() {
    const rings = this.rawGeometry;
    this.geometry = [];

    for (const ring of rings) {
      const newRing: Point[] = [];
      for (const coord of ring) {
        newRing.push(new Point(coord[0], coord[1]));
      }
      this.geometry.push(newRing);
    }
    return this.geometry;
  }

  bbox() {
    if (!this.geometry) {
      this.loadGeometry();
    }

    const rings = this.geometry;
    let x1 = Infinity;
    let x2 = -Infinity;
    let y1 = Infinity;
    let y2 = -Infinity;

    for (const ring of rings) {
      for (const coord of ring) {
        x1 = Math.min(x1, coord.x);
        x2 = Math.max(x2, coord.x);
        y1 = Math.min(y1, coord.y);
        y2 = Math.max(y2, coord.y);
      }
    }

    return [x1, y1, x2, y2];
  }

  // toGeoJSON(x, y, z) {
  //   return VectorTileFeature.prototype.toGeoJSON.call(this, x, y, z);
  // }
}
