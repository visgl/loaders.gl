export const TILE3D_CONTENT_STATE = {
  UNLOADED: 1, // Has never been requested
  LOADING_CONTENT: 2, // Is waiting on a pending request
  PROCESSING: 3, // Request received.  Contents are being processed for rendering.  Depending on the content, it might make its own requests for external data.
  READY: 4, // Ready to render.
  EXPIRED: 5, // Is expired and will be unloaded once new content is loaded.
  FAILED: 6 // Request failed.
};

export class I3STileNode {
  constructor(content) {
    this.id = content.id;
    this.level = content.level;
    this.mbs = content.mbs;
    this.lodMaxError = content.lodSelection[0].maxError;
    this.metricType = content.lodSelection[0].metricType;
    this.content = content;

    this._priority = this.lodMaxError;
    this._isVisible = false;
    this._contentState = content._contentState || TILE3D_CONTENT_STATE.UNLOADED;

    this.children = [];
  }
}

export default class I3STileTree {
  constructor() {
    this.children = [];
  }

  appendNode(node) {
    const searched = this.searchNode(node.id);
    if (searched) {
      return searched;
    }

    const newNode = new I3STileNode(node);
    const parentNode = this.searchNode(node.parentNode && node.parentNode.id);
    if (parentNode == null) {
      this.children.push(newNode);
      return this.children[this.children.length - 1];
    } else {
      parentNode.children.push(newNode);
      return parentNode.children[parentNode.children.length - 1];
    }
  }

  _dig(id, ids, node) {
    if (node.level > ids.length) {
      return null;
    }

    let keepGoing = false;
    if (node.id == id) {
      return node;
    } else if (node.id == 'root') {
      keepGoing = true;
    } else {
      let partId = ids[0];
      for (let i = 1; i < node.level - 1; i++) {
        partId = partId + '-' + ids[i];
      }

      if (node.id == partId) {
        keepGoing = true;
      }
    }

    if (keepGoing) {
      for (let i = 0; i < node.children.length; i++) {
        const target = this._dig(id, ids, node.children[i]);
        if (target) {
          return target;
        }
      }
    }

    return null;
  }

  searchNode(id) {
    if (id === null || id === undefined) {
      return null;
    }

    let target = null;
    const ids = `${id}`.split('-');
    for (let j = 0; j < this.children.length; j++) {
      target = this._dig(id, ids, this.children[j]);
      if (target) {
        return target;
      }
    }

    return null;
  }

  unloadNodeById(id) {
    const node = this.searchNode(id);

    if (node) {
      node._isVisible = false;
    }
  }

  unloadNodeByObject(node, onUnload) {
    if (node) {
      node._isVisible = false;
      node._contentState = TILE3D_CONTENT_STATE.UNLOADED;
    }
    if (onUnload) {
      onUnload(node);
    }
  }

  unloadSubTree(node, onUnload) {
    for (let i = 0; i < node.children.length; i++) {
      this.unloadSubTree(node.children[i], onUnload);
    }

    if (node._isVisible) {
      this.unloadNodeByObject(node, onUnload);
    }
  }
}
