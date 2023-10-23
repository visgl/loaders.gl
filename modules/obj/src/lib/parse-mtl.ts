// loaders.gl, MIT license
// Forked from THREE.js under MIT license
// https://github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/MTLLoader.js

// import type {DiffuseMaterial} from '@loaders.gl/schema';

export type MTLMaterial = {
  name: string;
  ambientColor?: [number, number, number];
  diffuseColor?: [number, number, number];
  specularColor?: [number, number, number];
  emissiveColor?: [number, number, number];
  // specular?: number;
  shininess?: number;
  refraction?: number;
  illumination?: number;
  diffuseTextureUrl?: string;
  emissiveTextureUrl?: string;
  specularTextureUrl?: string;
};

const DELIMITER_PATTERN = /\s+/;

/**
 * Set of options on how to construct materials
 * @param normalizeRGB: RGBs need to be normalized to 0-1 from 0-255 (Default: false, assumed to be already normalized)
 * @param ignoreZeroRGBs: Ignore values of RGBs (Ka,Kd,Ks) that are all 0's Default: false
 * @param baseUrl - Url relative to which textures are loaded
 */
export type ParseMTLOptions = {
  normalizeRGB?: boolean;
  ignoreZeroRGBs?: boolean;
  baseUrl?: string;
};

/**
 * Parses a MTL file.
 * Parses a Wavefront .mtl file specifying materials
 * http://paulbourke.net/dataformats/mtl/
 * https://www.loc.gov/preservation/digital/formats/fdd/fdd000508.shtml
 *
 * @param  text - Content of MTL file
 */
// eslint-disable-next-line complexity
export function parseMTL(text: string, options?: ParseMTLOptions): MTLMaterial[] {
  // const materialsInfo: Record<string, MTLMaterial> = {};
  const materials: MTLMaterial[] = [];

  let currentMaterial: MTLMaterial = {name: 'placeholder'};

  const lines = text.split('\n');
  for (let line of lines) {
    line = line.trim();

    if (line.length === 0 || line.charAt(0) === '#') {
      // Blank line or comment ignore
      continue; // eslint-disable-line no-continue
    }

    const pos = line.indexOf(' ');

    let key = pos >= 0 ? line.substring(0, pos) : line;
    key = key.toLowerCase();

    let value = pos >= 0 ? line.substring(pos + 1) : '';
    value = value.trim();

    switch (key) {
      case 'newmtl':
        // New material
        currentMaterial = {name: value};
        // insert into map
        materials.push(currentMaterial);
        break;

      case 'ka': // Ka
        currentMaterial.ambientColor = parseColor(value);
        break;

      case 'kd':
        // Kd: Diffuse color (color under white light) using RGB values
        currentMaterial.diffuseColor = parseColor(value);
        break;
      case 'map_kd':
        // Diffuse texture map
        currentMaterial.diffuseTextureUrl = value;
        //         setMapForType('map', value);
        break;

      case 'ks':
        // Specular color (color when light is reflected from shiny surface) using RGB values
        currentMaterial.specularColor = parseColor(value);
        break;
      case 'map_ks':
        // Specular map
        currentMaterial.specularTextureUrl = value;
        // setMapForType('specularMap', value);
        break;

      case 'ke':
        // Emissive using RGB values
        currentMaterial.emissiveColor = parseColor(value);
        break;
      case 'map_ke':
        // Emissive map
        currentMaterial.emissiveTextureUrl = value;
        // setMapForType('emissiveMap', value);
        break;

      case 'ns':
        // Ns is material specular exponent (defines the focus of the specular highlight)
        // A high exponent results in a tight, concentrated highlight. Ns values normally range from 0 to 1000.
        currentMaterial.shininess = parseFloat(value);
        break;
      case 'map_ns':
        // Ns is material specular exponent
        // TODO?
        // currentMaterial.shininessMap = parseFloat(value);
        break;
      case 'ni':
        currentMaterial.refraction = parseFloat(value);
        break;
      case 'illum':
        currentMaterial.illumination = parseFloat(value);
        break;

      default:
        // log unknown message?
        break;

      /*
      case 'norm':
        setMapForType('normalMap', value);
        break;

      case 'map_bump':
      case 'bump':
        // Bump texture map
        setMapForType('bumpMap', value);
        break;

      case 'd':
        n = parseFloat(value);
        if (n < 1) {
          params.opacity = n;
          params.transparent = true;
        }
        break;

      case 'map_d':
        // Alpha map
        setMapForType('alphaMap', value);
        params.transparent = true;
        break;

      case 'tr':
        n = parseFloat(value);
        if (this.options && this.options.invertTrProperty) n = 1 - n;
        if (n > 0) {
          params.opacity = 1 - n;
          params.transparent = true;
        }
      */
    }
  }

  return materials;
}

function parseColor(value: string, options?: ParseMTLOptions): [number, number, number] {
  const rgb = value.split(DELIMITER_PATTERN, 3);
  const color: [number, number, number] = [
    parseFloat(rgb[0]),
    parseFloat(rgb[1]),
    parseFloat(rgb[2])
  ];
  // TODO auto detect big values?
  // if (this.options && this.options.normalizeRGB) {
  //   value = [ value[ 0 ] / 255, value[ 1 ] / 255, value[ 2 ] / 255 ];
  // }

  // if (this.options && this.options.ignoreZeroRGBs) {
  //   if (value[ 0 ] === 0 && value[ 1 ] === 0 && value[ 2 ] === 0) {
  //     // ignore
  //     save = false;
  //   }
  // }
  return color;
}

/* TODO parse url options
function parseTexture(value, matParams) {
  const texParams = {
    scale: new Vector2(1, 1),
    offset: new Vector2(0, 0)
  };

  const items = value.split(/\s+/);
  let pos;

  pos = items.indexOf('-bm');
  if (pos >= 0) {
    matParams.bumpScale = parseFloat(items[ pos + 1 ]);
    items.splice(pos, 2);
  }

  pos = items.indexOf('-s');
  if (pos >= 0) {
    texParams.scale.set(parseFloat(items[ pos + 1 ]), parseFloat(items[ pos + 2 ]));
    items.splice(pos, 4); // we expect 3 parameters here!

  }

  pos = items.indexOf('-o');

  if (pos >= 0) {
    texParams.offset.set(parseFloat(items[ pos + 1 ]), parseFloat(items[ pos + 2 ]));
    items.splice(pos, 4); // we expect 3 parameters here!
  }

  texParams.url = items.join(' ').trim();
  return texParams;
}

 *function resolveURL(baseUrl, url) {
 * baseUrl?: string;
    // Absolute URL
    if (/^https?:\/\//i.test(url)) return url;
    return baseUrl + url;
  }

  function setMapForType(mapType, value) {
    if (params[ mapType ]) return; // Keep the first encountered texture

    const texParams = scope.getTextureParams(value, params);
    const map = scope.loadTexture(resolveURL(scope.baseUrl, texParams.url));

    map.repeat.copy(texParams.scale);
    map.offset.copy(texParams.offset);

    map.wrapS = scope.wrap;
    map.wrapT = scope.wrap;

    params[ mapType ] = map;
  }
*/
