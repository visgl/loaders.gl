// OBJ Loader, adapted from THREE.js (MIT license)
//
// Attributions per original THREE.js source file:
//
// @author mrdoob / http://mrdoob.com/

// @ts-nocheck

// o object_name | g group_name
const OBJECT_RE = /^[og]\s*(.+)?/;
// mtllib file_reference
const MATERIAL_RE = /^mtllib /;
// usemtl material_name
const MATERIAL_USE_RE = /^usemtl /;

class MeshMaterial {
  constructor({index, name = '', mtllib, smooth, groupStart}) {
    this.index = index;
    this.name = name;
    this.mtllib = mtllib;
    this.smooth = smooth;
    this.groupStart = groupStart;
    this.groupEnd = -1;
    this.groupCount = -1;
    this.inherited = false;
  }

  clone(index = this.index) {
    return new MeshMaterial({
      index,
      name: this.name,
      mtllib: this.mtllib,
      smooth: this.smooth,
      groupStart: 0
    });
  }
}

class MeshObject {
  constructor(name = '') {
    this.name = name;

    this.geometry = {
      vertices: [],
      normals: [],
      colors: [],
      uvs: []
    };

    this.materials = [];
    this.smooth = true;

    this.fromDeclaration = null;
  }

  startMaterial(name, libraries) {
    const previous = this._finalize(false);

    // New usemtl declaration overwrites an inherited material, except if faces were declared
    // after the material, then it must be preserved for proper MultiMaterial continuation.
    if (previous && (previous.inherited || previous.groupCount <= 0)) {
      this.materials.splice(previous.index, 1);
    }

    const material = new MeshMaterial({
      index: this.materials.length,
      name,
      mtllib:
        Array.isArray(libraries) && libraries.length > 0 ? libraries[libraries.length - 1] : '',
      smooth: previous !== undefined ? previous.smooth : this.smooth,
      groupStart: previous !== undefined ? previous.groupEnd : 0
    });

    this.materials.push(material);

    return material;
  }

  currentMaterial() {
    if (this.materials.length > 0) {
      return this.materials[this.materials.length - 1];
    }

    return undefined;
  }

  _finalize(end) {
    const lastMultiMaterial = this.currentMaterial();
    if (lastMultiMaterial && lastMultiMaterial.groupEnd === -1) {
      lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3;
      lastMultiMaterial.groupCount = lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart;
      lastMultiMaterial.inherited = false;
    }

    // Ignore objects tail materials if no face declarations followed them before a new o/g started.
    if (end && this.materials.length > 1) {
      for (let mi = this.materials.length - 1; mi >= 0; mi--) {
        if (this.materials[mi].groupCount <= 0) {
          this.materials.splice(mi, 1);
        }
      }
    }

    // Guarantee at least one empty material, this makes the creation later more straight forward.
    if (end && this.materials.length === 0) {
      this.materials.push({
        name: '',
        smooth: this.smooth
      });
    }

    return lastMultiMaterial;
  }
}

class ParserState {
  constructor() {
    this.objects = [];
    this.object = null;

    this.vertices = [];
    this.normals = [];
    this.colors = [];
    this.uvs = [];

    this.materialLibraries = [];

    this.startObject('', false);
  }

  startObject(name, fromDeclaration = true) {
    // If the current object (initial from reset) is not from a g/o declaration in the parsed
    // file. We need to use it for the first parsed g/o to keep things in sync.
    if (this.object && !this.object.fromDeclaration) {
      this.object.name = name;
      this.object.fromDeclaration = fromDeclaration;
      return;
    }

    const previousMaterial =
      this.object && typeof this.object.currentMaterial === 'function'
        ? this.object.currentMaterial()
        : undefined;

    if (this.object && typeof this.object._finalize === 'function') {
      this.object._finalize(true);
    }

    this.object = new MeshObject(name);
    this.object.fromDeclaration = fromDeclaration;

    // Inherit previous objects material.
    // Spec tells us that a declared material must be set to all objects until a new material is declared.
    // If a usemtl declaration is encountered while this new object is being parsed, it will
    // overwrite the inherited material. Exception being that there was already face declarations
    // to the inherited material, then it will be preserved for proper MultiMaterial continuation.
    if (previousMaterial && previousMaterial.name && typeof previousMaterial.clone === 'function') {
      const declared = previousMaterial.clone(0);
      declared.inherited = true;
      this.object.materials.push(declared);
    }

    this.objects.push(this.object);
  }

  finalize() {
    if (this.object && typeof this.object._finalize === 'function') {
      this.object._finalize(true);
    }
  }

  parseVertexIndex(value, len) {
    const index = parseInt(value, 10);
    return (index >= 0 ? index - 1 : index + len / 3) * 3;
  }

  parseNormalIndex(value, len) {
    const index = parseInt(value, 10);
    return (index >= 0 ? index - 1 : index + len / 3) * 3;
  }

  parseUVIndex(value, len) {
    const index = parseInt(value, 10);
    return (index >= 0 ? index - 1 : index + len / 2) * 2;
  }

  addVertex(a, b, c) {
    const src = this.vertices;
    const dst = this.object.geometry.vertices;

    dst.push(src[a + 0], src[a + 1], src[a + 2]);
    dst.push(src[b + 0], src[b + 1], src[b + 2]);
    dst.push(src[c + 0], src[c + 1], src[c + 2]);
  }

  addVertexPoint(a) {
    const src = this.vertices;
    const dst = this.object.geometry.vertices;

    dst.push(src[a + 0], src[a + 1], src[a + 2]);
  }

  addVertexLine(a) {
    const src = this.vertices;
    const dst = this.object.geometry.vertices;

    dst.push(src[a + 0], src[a + 1], src[a + 2]);
  }

  addNormal(a, b, c) {
    const src = this.normals;
    const dst = this.object.geometry.normals;

    dst.push(src[a + 0], src[a + 1], src[a + 2]);
    dst.push(src[b + 0], src[b + 1], src[b + 2]);
    dst.push(src[c + 0], src[c + 1], src[c + 2]);
  }

  addColor(a, b, c) {
    const src = this.colors;
    const dst = this.object.geometry.colors;

    dst.push(src[a + 0], src[a + 1], src[a + 2]);
    dst.push(src[b + 0], src[b + 1], src[b + 2]);
    dst.push(src[c + 0], src[c + 1], src[c + 2]);
  }

  addUV(a, b, c) {
    const src = this.uvs;
    const dst = this.object.geometry.uvs;

    dst.push(src[a + 0], src[a + 1]);
    dst.push(src[b + 0], src[b + 1]);
    dst.push(src[c + 0], src[c + 1]);
  }

  addUVLine(a) {
    const src = this.uvs;
    const dst = this.object.geometry.uvs;

    dst.push(src[a + 0], src[a + 1]);
  }

  // eslint-disable-next-line max-params
  addFace(a, b, c, ua, ub, uc, na, nb, nc) {
    const vLen = this.vertices.length;

    let ia = this.parseVertexIndex(a, vLen);
    let ib = this.parseVertexIndex(b, vLen);
    let ic = this.parseVertexIndex(c, vLen);

    this.addVertex(ia, ib, ic);

    if (ua !== undefined && ua !== '') {
      const uvLen = this.uvs.length;
      ia = this.parseUVIndex(ua, uvLen);
      ib = this.parseUVIndex(ub, uvLen);
      ic = this.parseUVIndex(uc, uvLen);
      this.addUV(ia, ib, ic);
    }

    if (na !== undefined && na !== '') {
      // Normals are many times the same. If so, skip function call and parseInt.
      const nLen = this.normals.length;
      ia = this.parseNormalIndex(na, nLen);

      ib = na === nb ? ia : this.parseNormalIndex(nb, nLen);
      ic = na === nc ? ia : this.parseNormalIndex(nc, nLen);

      this.addNormal(ia, ib, ic);
    }

    if (this.colors.length > 0) {
      this.addColor(ia, ib, ic);
    }
  }

  addPointGeometry(vertices) {
    this.object.geometry.type = 'Points';

    const vLen = this.vertices.length;

    for (const vertex of vertices) {
      this.addVertexPoint(this.parseVertexIndex(vertex, vLen));
    }
  }

  addLineGeometry(vertices, uvs) {
    this.object.geometry.type = 'Line';

    const vLen = this.vertices.length;
    const uvLen = this.uvs.length;

    for (const vertex of vertices) {
      this.addVertexLine(this.parseVertexIndex(vertex, vLen));
    }

    for (const uv of uvs) {
      this.addUVLine(this.parseUVIndex(uv, uvLen));
    }
  }
}

// eslint-disable-next-line max-statements, complexity
export default (text) => {
  const state = new ParserState();

  if (text.indexOf('\r\n') !== -1) {
    // This is faster than String.split with regex that splits on both
    text = text.replace(/\r\n/g, '\n');
  }

  if (text.indexOf('\\\n') !== -1) {
    // join lines separated by a line continuation character (\)
    text = text.replace(/\\\n/g, '');
  }

  const lines = text.split('\n');
  let line = '';
  let lineFirstChar = '';
  let lineLength = 0;
  let result = [];

  // Faster to just trim left side of the line. Use if available.
  const trimLeft = typeof ''.trimLeft === 'function';

  /* eslint-disable no-continue, max-depth */
  for (let i = 0, l = lines.length; i < l; i++) {
    line = lines[i];
    line = trimLeft ? line.trimLeft() : line.trim();
    lineLength = line.length;

    if (lineLength === 0) continue;

    lineFirstChar = line.charAt(0);

    // @todo invoke passed in handler if any
    if (lineFirstChar === '#') continue;

    if (lineFirstChar === 'v') {
      const data = line.split(/\s+/);

      switch (data[0]) {
        case 'v':
          state.vertices.push(parseFloat(data[1]), parseFloat(data[2]), parseFloat(data[3]));
          if (data.length === 8) {
            state.colors.push(parseFloat(data[4]), parseFloat(data[5]), parseFloat(data[6]));
          }
          break;
        case 'vn':
          state.normals.push(parseFloat(data[1]), parseFloat(data[2]), parseFloat(data[3]));
          break;
        case 'vt':
          state.uvs.push(parseFloat(data[1]), parseFloat(data[2]));
          break;
        default:
      }
    } else if (lineFirstChar === 'f') {
      const lineData = line.substr(1).trim();
      const vertexData = lineData.split(/\s+/);
      const faceVertices = [];

      // Parse the face vertex data into an easy to work with format

      for (let j = 0, jl = vertexData.length; j < jl; j++) {
        const vertex = vertexData[j];

        if (vertex.length > 0) {
          const vertexParts = vertex.split('/');
          faceVertices.push(vertexParts);
        }
      }

      // Draw an edge between the first vertex and all subsequent vertices to form an n-gon

      const v1 = faceVertices[0];

      for (let j = 1, jl = faceVertices.length - 1; j < jl; j++) {
        const v2 = faceVertices[j];
        const v3 = faceVertices[j + 1];

        state.addFace(v1[0], v2[0], v3[0], v1[1], v2[1], v3[1], v1[2], v2[2], v3[2]);
      }
    } else if (lineFirstChar === 'l') {
      const lineParts = line.substring(1).trim().split(' ');
      let lineVertices;
      const lineUVs = [];

      if (line.indexOf('/') === -1) {
        lineVertices = lineParts;
      } else {
        lineVertices = [];
        for (let li = 0, llen = lineParts.length; li < llen; li++) {
          const parts = lineParts[li].split('/');

          if (parts[0] !== '') lineVertices.push(parts[0]);
          if (parts[1] !== '') lineUVs.push(parts[1]);
        }
      }
      state.addLineGeometry(lineVertices, lineUVs);
    } else if (lineFirstChar === 'p') {
      const lineData = line.substr(1).trim();
      const pointData = lineData.split(' ');

      state.addPointGeometry(pointData);
    } else if ((result = OBJECT_RE.exec(line)) !== null) {
      // o object_name
      // or
      // g group_name

      // WORKAROUND: https://bugs.chromium.org/p/v8/issues/detail?id=2869
      // var name = result[ 0 ].substr( 1 ).trim();
      const name = (' ' + result[0].substr(1).trim()).substr(1); // eslint-disable-line

      state.startObject(name);
    } else if (MATERIAL_USE_RE.test(line)) {
      // material

      state.object.startMaterial(line.substring(7).trim(), state.materialLibraries);
    } else if (MATERIAL_RE.test(line)) {
      // mtl file

      state.materialLibraries.push(line.substring(7).trim());
    } else if (lineFirstChar === 's') {
      result = line.split(' ');

      // smooth shading

      // @todo Handle files that have varying smooth values for a set of faces inside one geometry,
      // but does not define a usemtl for each face set.
      // This should be detected and a dummy material created (later MultiMaterial and geometry groups).
      // This requires some care to not create extra material on each smooth value for "normal" obj files.
      // where explicit usemtl defines geometry groups.
      // Example asset: examples/models/obj/cerberus/Cerberus.obj

      /*
       * http://paulbourke.net/dataformats/obj/
       * or
       * http://www.cs.utah.edu/~boulos/cs3505/obj_spec.pdf
       *
       * From chapter "Grouping" Syntax explanation "s group_number":
       * "group_number is the smoothing group number. To turn off smoothing groups, use a value of 0 or off.
       * Polygonal elements use group numbers to put elements in different smoothing groups. For free-form
       * surfaces, smoothing groups are either turned on or off; there is no difference between values greater
       * than 0."
       */
      if (result.length > 1) {
        const value = result[1].trim().toLowerCase();
        state.object.smooth = value !== '0' && value !== 'off';
      } else {
        // ZBrush can produce "s" lines #11707
        state.object.smooth = true;
      }
      const material = state.object.currentMaterial();
      if (material) material.smooth = state.object.smooth;
    } else {
      // Handle null terminated files without exception
      if (line === '\0') continue;

      throw new Error(`Unexpected line: "${line}"`);
    }
  }

  state.finalize();

  const meshes = [];
  const materials = [];

  for (const object of state.objects) {
    const {geometry} = object;

    // Skip o/g line declarations that did not follow with any faces
    if (geometry.vertices.length === 0) continue;

    const mesh = {
      header: {
        vertexCount: geometry.vertices.length / 3
      },
      attributes: {}
    };

    switch (geometry.type) {
      case 'Points':
        mesh.mode = 0; // GL.POINTS
        break;
      case 'Line':
        mesh.mode = 1; // GL.LINES
        break;
      default:
        mesh.mode = 4; // GL.TRIANGLES
        break;
    }

    mesh.attributes.POSITION = {value: new Float32Array(geometry.vertices), size: 3};

    if (geometry.normals.length > 0) {
      mesh.attributes.NORMAL = {value: new Float32Array(geometry.normals), size: 3};
    }

    if (geometry.colors.length > 0) {
      mesh.attributes.COLOR_0 = {value: new Float32Array(geometry.colors), size: 3};
    }

    if (geometry.uvs.length > 0) {
      mesh.attributes.TEXCOORD_0 = {value: new Float32Array(geometry.uvs), size: 2};
    }

    // Create materials
    mesh.materials = [];
    for (const sourceMaterial of object.materials) {
      // TODO - support full spec
      const _material = {
        name: sourceMaterial.name,
        flatShading: !sourceMaterial.smooth
      };
      mesh.materials.push(_material);
      materials.push(_material);
    }

    mesh.name = object.name;
    meshes.push(mesh);
  }

  return {meshes, materials};
};
