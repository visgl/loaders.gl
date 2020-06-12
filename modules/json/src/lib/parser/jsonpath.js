
export default class JSONPath {
  constructor(pathstring = null) {
    this.path = [];

    if (pathstring) {
      const components = pathstring.split('.');
      if (components[0] !== '$') {
        throw new Error('JSONPaths must start with $');
      }
      components.shift();
    }
  }

  push() {

  }

  _compareJSONPaths(path1, path2) {
    if (!path1 || !path2 || path1.length !== path2.length) {
      return false;
    }

    for (let i = 0; i < path1.length; ++i) {
      if (path1[i] !== path2[i]) {
        return false;
      }
    }

    return true;
  }
