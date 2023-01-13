import transform from 'json-map-transform';

const PLAIN_GEOMETRY_DEFINITION = () => ({
  offset: {
    default: 8
  },
  position: {
    default: {
      type: 'Float32',
      component: 3
    }
  },
  normal: {
    default: {
      type: 'Float32',
      component: 3
    }
  },
  uv0: {
    path: 'hasTexture',
    transform: (val) => (val && {type: 'Float32', component: 2}) || false,
    omitValues: [false]
  },
  color: {
    default: {
      type: 'UInt8',
      component: 4
    }
  },
  uvRegion: {
    path: 'hasUvRegions',
    transform: (val) => (val && {type: 'UInt16', component: 4}) || false,
    omitValues: [false]
  },
  featureId: {
    default: {
      binding: 'per-feature',
      type: 'UInt64',
      component: 1
    }
  },
  faceRange: {
    default: {
      binding: 'per-feature',
      type: 'UInt32',
      component: 2
    }
  }
});

const COMPRESSED_GEOMETRY_DEFINITION = () => ({
  'compressedAttributes.encoding': {
    default: 'draco'
  },
  'compressedAttributes.attributes': {
    path: 'geometryConfig',
    transform: (val) => {
      const result = ['position', 'normal'];
      if (val.hasTexture) {
        result.push('uv0');
      }
      result.push('color');
      if (val.hasUvRegions) {
        result.push('uv-region');
      }
      result.push('feature-index');
      return result;
    }
  }
});

export const GEOMETRY_DEFINITION = () => ({
  geometryBuffers: {
    path: 'geometryConfig',
    transform: (val) => {
      const result = [transform(val, PLAIN_GEOMETRY_DEFINITION())];
      if (val.draco) {
        result.push(transform({geometryConfig: val}, COMPRESSED_GEOMETRY_DEFINITION()));
      }
      return result;
    }
  }
});
