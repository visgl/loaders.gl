/* eslint-disable */

// @ts-nocheck

export class PointCloudOctree {
  constructor() {
    this.url = null;
    this.octreeDir = null;
    this.spacing = 0;
    this.boundingBox = null;
    this.root = null;
    this.nodes = null;
    this.pointAttributes = null;
    this.hierarchyStepSize = -1;
    this.loader = null;
  }
}

export class PointCloudOctant {
  constructor(name, octree, boundingBox) {
    this.octree = this.id = PointCloudOctreeGeometryNode.IDCount++;
    this.name = name;
    this.index = parseInt(name.charAt(name.length - 1));
    this.octree = octree;
    this.geometry = null;
    this.boundingBox = boundingBox;
    this.boundingSphere = boundingBox.getBoundingSphere(new THREE.Sphere());
    this.children = {};
    this.numPoints = 0;
    this.level = null;
    this.loaded = false;
    this.oneTimeDisposeHandlers = [];
  }

  isGeometryNode() {
    return true;
  }

  getLevel() {
    return this.level;
  }

  isTreeNode() {
    return false;
  }

  isLoaded() {
    return this.loaded;
  }

  getBoundingSphere() {
    return this.boundingSphere;
  }

  getBoundingBox() {
    return this.boundingBox;
  }

  getChildren() {
    // Children is a length 8 array with nulls for "missing" octants
    return this.children.filter(Boolean);
  }

  getURL() {
    const {version} = this.octree;
    const hierarchyPath = version >= 1.5 ? `${this.getHierarchyPath()}/` : '';
    return `${this.octree.octreeDir}/${hierarchyPath}${this.name}`;
  }

  getHierarchyPath() {
    let path = 'r/';

    let hierarchyStepSize = this.octree.hierarchyStepSize;
    let indices = this.name.substr(1);

    let numParts = Math.floor(indices.length / hierarchyStepSize);
    for (let i = 0; i < numParts; i++) {
      path += indices.substr(i * hierarchyStepSize, hierarchyStepSize) + '/';
    }

    path = path.slice(0, -1);

    return path;
  }

  addChild(child) {
    this.children[child.index] = child;
    child.parent = this;
  }

  load() {
    if (
      this.loading === true ||
      this.loaded === true ||
      Potree.numNodesLoading >= Potree.maxNodesLoading
    ) {
      return;
    }

    this.loading = true;

    Potree.numNodesLoading++;

    if (this.octree.loader.version.equalOrHigher('1.5')) {
      if (this.level % this.octree.hierarchyStepSize === 0 && this.hasChildren) {
        this.loadHierachyThenPoints();
      } else {
        this.loadPoints();
      }
    } else {
      this.loadPoints();
    }
  }

  loadPoints() {
    this.octree.loader.load(this);
  }

  loadHierachyThenPoints() {
    let node = this;

    // load hierarchy
    let callback = function (node, hbuffer) {
      let view = new DataView(hbuffer);

      let stack = [];
      let children = view.getUint8(0);
      let numPoints = view.getUint32(1, true);
      node.numPoints = numPoints;
      stack.push({children: children, numPoints: numPoints, name: node.name});

      let decoded = [];

      let offset = 5;
      while (stack.length > 0) {
        let snode = stack.shift();
        let mask = 1;
        for (let i = 0; i < 8; i++) {
          if ((snode.children & mask) !== 0) {
            let childName = snode.name + i;

            let childChildren = view.getUint8(offset);
            let childNumPoints = view.getUint32(offset + 1, true);

            stack.push({children: childChildren, numPoints: childNumPoints, name: childName});

            decoded.push({children: childChildren, numPoints: childNumPoints, name: childName});

            offset += 5;
          }

          mask = mask * 2;
        }

        if (offset === hbuffer.byteLength) {
          break;
        }
      }

      // console.log(decoded);

      let nodes = {};
      nodes[node.name] = node;
      let pco = node.pcoGeometry;

      for (let i = 0; i < decoded.length; i++) {
        let name = decoded[i].name;
        let decodedNumPoints = decoded[i].numPoints;
        let index = parseInt(name.charAt(name.length - 1));
        let parentName = name.substring(0, name.length - 1);
        let parentNode = nodes[parentName];
        let level = name.length - 1;
        let boundingBox = Utils.createChildAABB(parentNode.boundingBox, index);

        let currentNode = new PointCloudOctreeGeometryNode(name, pco, boundingBox);
        currentNode.level = level;
        currentNode.numPoints = decodedNumPoints;
        currentNode.hasChildren = decoded[i].children > 0;
        currentNode.spacing = pco.spacing / Math.pow(2, level);
        parentNode.addChild(currentNode);
        nodes[name] = currentNode;
      }

      node.loadPoints();
    };
    if (node.level % node.pcoGeometry.hierarchyStepSize === 0) {
      // let hurl = node.pcoGeometry.octreeDir + "/../hierarchy/" + node.name + ".hrc";
      let hurl =
        node.pcoGeometry.octreeDir + '/' + node.getHierarchyPath() + '/' + node.name + '.hrc';

      let xhr = XHRFactory.createXMLHttpRequest();
      xhr.open('GET', hurl, true);
      xhr.responseType = 'arraybuffer';
      xhr.overrideMimeType('text/plain; charset=x-user-defined');
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200 || xhr.status === 0) {
            let hbuffer = xhr.response;
            callback(node, hbuffer);
          } else {
            console.log('Failed to load file! HTTP status: ' + xhr.status + ', file: ' + hurl);
            Potree.numNodesLoading--;
          }
        }
      };
      try {
        xhr.send(null);
      } catch (e) {
        console.log('fehler beim laden der punktwolke: ' + e);
      }
    }
  }

  getNumPoints() {
    return this.numPoints;
  }

  dispose() {
    if (this.geometry && this.parent != null) {
      this.geometry.dispose();
      this.geometry = null;
      this.loaded = false;

      // this.dispatchEvent( { type: 'dispose' } );
      for (let i = 0; i < this.oneTimeDisposeHandlers.length; i++) {
        let handler = this.oneTimeDisposeHandlers[i];
        handler();
      }
      this.oneTimeDisposeHandlers = [];
    }
  }
}

PointCloudOctreeGeometryNode.IDCount = 0;
