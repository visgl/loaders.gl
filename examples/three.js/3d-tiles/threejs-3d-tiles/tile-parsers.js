/* global fetch */
import * as THREE from 'three';
import TileHeader from './tile-header';

import {load} from '@loaders.gl/core';
import {Tile3DLoader} from '@loaders.gl/3d-tiles';

export async function loadTileset(url, styleParams) {
  const response = await fetch(url);
  const json = await response.json();

  const tileset = {
    url,
    version: json.asset.version,
    geometricError: json.geometricError,
    gltfUpAxis: 'Z',
    refine: json.refine ? json.refine.toUpperCase() : 'ADD',
    root: null
  };

  const resourcePath = THREE.LoaderUtils.extractUrlBase(url);
  tileset.root = new TileHeader(json.root, resourcePath, styleParams, tileset.refine, true);

  return tileset;
}

export async function loadPointTile(url) {
  const content = await load(url, Tile3DLoader, {loadGLTF: false});

  const tile = {
    rtc_center: content.rtcCenter, // eslint-disable-line camelcase
    points: content.attributes.positions
  };
  const {colors} = content.attributes;
  if (colors && colors.size === 3) {
    tile.rgb = colors.value;
  }
  if (colors && colors.size === 4) {
    tile.rgba = colors.value;
  }

  return tile;
}

export async function loadBatchedModelTile(url) {
  const content = await load(url, Tile3DLoader, {loadGLTF: false});
  const tile = {};
  tile.glbData = content.gltfArrayBuffer;
  return tile;
}

/*
export default class TileSetParser {
  constructor() {
    this.url = null;
    this.version = null;
    this.gltfUpAxis = 'Z';
    this.geometricError = null;
    this.root = null;
  }

  async load(url, styleParams) {
    this.url = url;
    const response = await fetch(url);
    const json = await response.json();

    this.version = json.asset.version;
    this.geometricError = json.geometricError;
    this.refine = json.refine ? json.refine.toUpperCase() : 'ADD';

    const resourcePath = THREE.LoaderUtils.extractUrlBase(url);
    this.root = new TileHeader(json.root, resourcePath, styleParams, this.refine, true);
  }
}
*/
