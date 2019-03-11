/**
 * Original Author Credentials:
 *
 * Author - Nick Blackwell
 * License - MIT
 */

/**
 * KMLParser Class parses standard kml documents and returns objects
 * representiong it's data.
 * the optional transformations define the data within these objects,
 * ie, documentTransform (for Geolive)
 * will create a Layer object from its contents, and pull out the items
 * which will be transformed aswell as MapItems.
 */

export default class KMLParser {
  parse(kml, options) {
    this.kml = kml;
    this.options = options;
    /* global console */
    this.log = options.log || console;

    return {
      documents: this._filter(this.ParseDomDocuments(this.kml)),
      folders: this._filter(this.ParseDomFolders(this.kml)),
      markers: this._filter(this.ParseDomMarkers(this.kml)),
      polygons: this._filter(this.ParseDomPolygons(this.kml)),
      lines: this._filter(this.ParseDomLines(this.kml)),
      overlays: this._filter(this.ParseDomGroundOverlays(this.kml)),
      links: this._filter(this.ParseDomLinks(this.kml))
    };
  }

  parseDocuments(callback) {
    const documentData = this._filter(this.ParseDomDocuments(this.kml));
    documentData.forEach((p, i) => callback(p, this.kml, documentData, i));
    return this;
  }

  parseFolders(callback) {
    const folderData = this._filter(this.ParseDomFolders(this.kml));
    folderData.forEach((p, i) => callback(p, this.kml, folderData, i));
    return this;
  }

  parseMarkers(callback) {
    const markerData = this._filter(this.ParseDomMarkers(this.kml));
    markerData.forEach((p, i) => callback(p, this.kml, markerData, i));
    return this;
  }

  parsePolygons(callback) {
    const polygonData = this._filter(this.ParseDomPolygons(this.kml));
    polygonData.forEach((p, i) => callback(p, this.kml, polygonData, i));
    return this;
  }

  parseLines(callback) {
    const lineData = this._filter(this.ParseDomLines(this.kml));
    lineData.forEach((p, i) => callback(p, this.kml, lineData, i));
    return this;
  }

  parseGroundOverlays(callback) {
    const overlayData = this._filter(this.ParseDomGroundOverlays(this.kml));
    overlayData.forEach((o, i) => callback(o, this.kml, overlayData, i));
    return this;
  }

  parseNetworklinks(callback) {
    const linkData = this._filter(this.ParseDomLinks(this.kml));
    linkData.forEach((p, i) => callback(p, this.kml, linkData, i));
    return this;
  }

  _filter(a) {
    const filtered = [];
    if (this._filters && a && a.length) {
      a.forEach(item => {
        let bool = true;
        this._filters.forEach(f => {
          if (f(item) === false) {
            bool = false;
          }
        });
        if (bool) {
          filtered.push(item);
        }
      });
      return filtered;
    }
    return a;
  }

  addFilter(filter) {
    if (!this._filters) {
      this._filters = [];
    }
    this._filters.push(filter);
    return this;
  }

  ParseDomDocuments(xmlDom) {
    const docs = [];
    const docsDomNodes = xmlDom.getElementsByTagName('Document');
    for (let i = 0; i < docsDomNodes.length; i++) {
      const node = docsDomNodes.item(i);
      const docsData = Object.assign(
        {},
        this.ParseDomDoc(node),
        this.ParseNonSpatialDomData(node, {})
      );

      const transform = options => options;
      docs.push(transform(docsData));
    }
    return docs;
  }

  ParseDomDoc(xmlDom) {
    return {};
  }

  ParseDomFolders(xmlDom) {
    const folders = [];
    const folderDomNodes = this.ParseDomItems(xmlDom, 'Folder');
    for (let i = 0; i < folderDomNodes.length; i++) {
      const node = folderDomNodes[i];
      const folderData = Object.assign(
        {
          type: 'folder'
        },
        this.ParseDomFolder(node),
        this.ParseNonSpatialDomData(node, {})
      );

      const transform = options => options;
      folders.push(transform(folderData));
    }
    return folders;
  }

  ParseDomLinks(xmlDom) {
    const links = [];
    const linkDomNodes = xmlDom.getElementsByTagName('NetworkLink');
    for (let i = 0; i < linkDomNodes.length; i++) {
      const node = linkDomNodes.item(i);
      const linkData = Object.assign(
        {},
        this.ParseDomLink(node),
        this.ParseNonSpatialDomData(node, {})
      );

      const transform = options => options;
      links.push(transform(linkData));
    }
    return links;
  }

  ParseDomFolder(xmlDom) {
    return {};
  }

  ParseDomLink(xmlDom) {
    const urls = xmlDom.getElementsByTagName('href');
    const link = {
      type: 'link'
    };
    if (urls.length > 0) {
      const url = urls.item(0);
      link.url = this.Value(url);
    }
    return link;
  }

  ParseDomLines(xmlDom) {
    const lines = [];
    const lineDomNodes = this.ParseDomItems(xmlDom, 'LineString');
    for (let i = 0; i < lineDomNodes.length; i++) {
      const node = lineDomNodes[i];

      const polygonData = Object.assign(
        {
          type: 'line',
          lineColor: '#FF000000', // black
          lineWidth: 1,
          polyColor: '#77000000', // black semitransparent,
          coordinates: this.ParseDomCoordinates(node) // returns an array of GLatLngs
        },
        this.ParseNonSpatialDomData(node, {}),
        this.ResolveDomStyle(this.ParseDomStyle(node), xmlDom)
      );

      const rgb = this.convertKMLColorToRGB(polygonData.lineColor);
      polygonData.lineOpacity = rgb.opacity;
      polygonData.lineColor = rgb.color;

      lines.push(polygonData);
    }

    return lines;
  }

  ParseDomGroundOverlays(xmlDom) {
    const lines = [];
    const lineDomNodes = this.ParseDomItems(xmlDom, 'GroundOverlay');
    for (let i = 0; i < lineDomNodes.length; i++) {
      const node = lineDomNodes[i];

      const polygonData = Object.assign(
        {
          type: 'imageoverlay',
          icon: this.ParseDomIcon(node),
          bounds: this.ParseDomBounds(node)
        },
        this.ParseNonSpatialDomData(node, {})
      );

      lines.push(polygonData);
    }

    return lines;
  }

  ParseDomPolygons(xmlDom) {
    const polygons = [];
    const polygonDomNodes = this.ParseDomItems(xmlDom, 'Polygon');

    for (let i = 0; i < polygonDomNodes.length; i++) {
      const node = polygonDomNodes[i];

      const polygonData = Object.assign(
        {
          type: 'polygon',
          fill: true,
          lineColor: '#FF000000', // black
          lineWidth: 1,
          polyColor: '#77000000', // black semitransparent,
          coordinates: this.ParseDomCoordinates(node) // returns an array of google.maps.LatLng
        },
        this.ParseNonSpatialDomData(node, {}),
        this.ResolveDomStyle(this.ParseDomStyle(node), xmlDom)
      );

      const lineRGB = this.convertKMLColorToRGB(polygonData.lineColor);

      polygonData.lineOpacity = lineRGB.opacity;
      polygonData.lineColor = lineRGB.color;

      const polyRGB = this.convertKMLColorToRGB(polygonData.polyColor);

      polygonData.polyOpacity = polygonData.fill ? polyRGB.opacity : 0;
      polygonData.polyColor = polyRGB.color;

      polygons.push(polygonData);
    }
    return polygons;
  }

  ParseDomMarkers(xmlDom) {
    const markers = [];
    const markerDomNodes = this.ParseDomItems(xmlDom, 'Point');

    for (let i = 0; i < markerDomNodes.length; i++) {
      const node = markerDomNodes[i];
      const coords = this.ParseDomCoordinates(node);
      const marker = Object.assign(
        {
          type: 'point',
          coordinates: coords[0] // returns an array of google.maps.LatLng
        },
        this.ParseNonSpatialDomData(node, {})
      );

      let icon = this.ParseDomStyle(node);
      if (icon.charAt(0) === '#') {
        icon = this.ResolveDomStyle(icon, xmlDom).icon;
      }
      if (icon) {
        // better to not have any hint of an icon (ie: icon:null) so default can be used by caller
        marker.icon = icon;
      }
      markers.push(marker);
    }
    return markers;
  }

  ParseDomCoordinates(xmlDom) {
    const coordNodes = xmlDom.getElementsByTagName('coordinates');
    if (!coordNodes.length) {
      this.log.warn([
        'this. DOM Node did not contain coordinates!',
        {
          node: xmlDom
        }
      ]);
      return null;
    }
    const node = coordNodes.item(0);
    let s = this.Value(node);
    s = s.trim();
    const coordStrings = s.split(' ');
    const coordinates = [];
    Object.values(coordStrings).forEach(coord => {
      const c = coord.split(',');
      if (c.length > 1) {
        // JSConsole([c[1],c[0]]);
        coordinates.push([c[1], c[0]]);
      }
    });

    return coordinates;
  }

  /* eslint-disable max-statements */
  ParseDomBounds(xmlDom) {
    const coordNodes = xmlDom.getElementsByTagName('LatLonBox');
    if (!coordNodes.length) {
      this.log.warn([
        'this. DOM Node did not contain coordinates!',
        {
          node: xmlDom
        }
      ]);
      return null;
    }
    const node = coordNodes.item(0);
    const norths = node.getElementsByTagName('north');
    const souths = node.getElementsByTagName('south');
    const easts = node.getElementsByTagName('east');
    const wests = node.getElementsByTagName('west');

    let north = null;
    let south = null;
    let east = null;
    let west = null;

    if (!norths.length) {
      this.log.warn([
        'this. DOM LatLngBox Node did not contain north!',
        {
          node: xmlDom
        }
      ]);
    } else {
      north = parseFloat(this.Value(norths.item(0)));
    }
    if (!souths.length) {
      this.log.warn([
        'this. DOM LatLngBox Node did not contain south!',
        {
          node: xmlDom
        }
      ]);
    } else {
      south = parseFloat(this.Value(souths.item(0)));
    }
    if (!easts.length) {
      this.log.warn([
        'this. DOM LatLngBox Node did not contain east!',
        {
          node: xmlDom
        }
      ]);
    } else {
      east = parseFloat(this.Value(easts.item(0)));
    }
    if (!wests.length) {
      this.log.warn([
        'this. DOM LatLngBox Node did not contain west!',
        {
          node: xmlDom
        }
      ]);
    } else {
      west = parseFloat(this.Value(wests.item(0)));
    }
    return {
      north,
      south,
      east,
      west
    };
  }
  /* eslint-enable max-statements */

  ParseNonSpatialDomData(xmlDom, options) {
    const config = Object.assign(
      {},
      {
        maxOffset: 2
      },
      options
    );

    const data = {
      name: '',
      description: null,
      tags: {}
    };

    const names = xmlDom.getElementsByTagName('name');
    for (let i = 0; i < names.length; i++) {
      if (this.WithinOffsetDom(xmlDom, names.item(i), config.maxOffset)) {
        data.name = this.Value(names.item(i));
        break;
      }
    }

    const descriptions = xmlDom.getElementsByTagName('description');
    for (let i = 0; i < descriptions.length; i++) {
      if (this.WithinOffsetDom(xmlDom, descriptions.item(i), config.maxOffset)) {
        data.description = this.Value(descriptions.item(i));
        break;
      }
    }

    if (xmlDom.hasAttribute('id')) {
      data.id = parseInt(xmlDom.getAttribute('id'), 10);
    }

    const extendedDatas = xmlDom.getElementsByTagName('ExtendedData');
    for (let i = 0; i < extendedDatas.length; i++) {
      if (this.WithinOffsetDom(xmlDom, extendedDatas.item(i), config.maxOffset)) {
        for (let j = 0; j < extendedDatas.item(i).childNodes.length; j++) {
          const c = extendedDatas.item(i).childNodes.item(j);
          const t = this.ParseTag(c);
          if (t.name !== '#text') {
            // eslint-disable-line
            data.tags[t.name] = t.value;
          }
        }
      }
    }
    return data;
  }

  ParseTag(xmlDom) {
    const tags = {
      name: null,
      value: {}
    };

    switch (xmlDom.nodeName) {
      case 'Data':
      case 'data':
        // TODO: add data tags...
        break;
      case 'ID':
        tags.name = 'ID';
        tags.value = this.Value(xmlDom);
        break;
      default:
        tags.name = xmlDom.nodeName;
        tags.value = this.Value(xmlDom);
        break;
    }

    return tags;
  }

  WithinOffsetDom(parent, child, max) {
    let current = child.parentNode;
    for (let i = 0; i < max; i++) {
      if (current.nodeName === (typeof parent === 'string' ? parent : parent.nodeName)) {
        return true;
      }
      current = current.parentNode;
    }
    this.log.error([
      'this. Could not find parent node within expected bounds.',
      {
        parentNode: parent,
        childNode: child,
        bounds: max
      }
    ]);
    return false;
  }

  ParseDomStyle(xmlDom, options) {
    const config = Object.assign(
      {},
      {
        defaultStyle: 'default'
      },
      options
    );

    const styles = xmlDom.getElementsByTagName('styleUrl');
    let style = config.defaultStyle;
    if (styles.length === 0) {
      this.log.warn([
        'this. DOM Node did not contain styleUrl!',
        {
          node: xmlDom,
          options: config
        }
      ]);
    } else {
      const node = styles.item(0);
      style = this.Value(node);
    }
    return style;
  }

  ParseDomIcon(xmlDom, options) {
    const config = Object.assign(
      {},
      {
        defaultIcon: false,
        defaultScale: 1.0
      },
      options
    );

    const icons = xmlDom.getElementsByTagName('Icon');
    let icon = config.defaultStyle;
    let scale = config.defaultScale;
    if (icons.length === 0) {
      this.log.warn([
        'this. DOM Node did not contain Icon!',
        {
          node: xmlDom,
          options: config
        }
      ]);
    } else {
      const node = icons.item(0);
      const urls = node.getElementsByTagName('href');
      if (urls.length === 0) {
        this.log.warn([
          'this. DOM Icon Node did not contain href!',
          {
            node: xmlDom,
            options: config
          }
        ]);
      } else {
        const hrefNode = urls.item(0);
        icon = this.Value(hrefNode);
      }

      const scales = node.getElementsByTagName('viewBoundScale');
      if (scales.length === 0) {
        this.log.warn([
          'this. DOM Icon Node did not contain viewBoundScale!',
          {
            node: xmlDom,
            options: config
          }
        ]);
      } else {
        const scaleNode = scales.item(0);
        scale = parseFloat(this.Value(scaleNode));
      }
    }
    return {
      url: icon,
      scale
    };
  }

  /* eslint-disable max-depth, max-statements */
  ResolveDomStyle(style, xmlDom) {
    const data = {};
    const name = style.charAt(0) === '#' ? style.substring(1, style.length) : style;
    const styles = xmlDom.getElementsByTagName('Style');
    for (let i = 0; i < styles.length; i++) {
      const node = styles.item(i);
      const id = node.getAttribute('id');
      if (id === name) {
        const lineStyles = node.getElementsByTagName('LineStyle');
        const polyStyles = node.getElementsByTagName('PolyStyle');
        const iconStyles = node.getElementsByTagName('href');
        if (lineStyles.length > 0) {
          const lineStyle = lineStyles.item(0);
          const colors = lineStyle.getElementsByTagName('color');
          if (colors.length > 0) {
            const color = colors.item(0);
            data.lineColor = this.Value(color);
          }
          const widths = lineStyle.getElementsByTagName('width');
          if (widths.length > 0) {
            const width = widths.item(0);
            data.lineWidth = this.Value(width);
          }
        }
        if (polyStyles.length > 0) {
          const polyStyle = polyStyles.item(0);
          const colors = polyStyle.getElementsByTagName('color');
          if (colors.length > 0) {
            const color = colors.item(0);
            data.polyColor = this.Value(color);
          }
          const outlines = polyStyle.getElementsByTagName('outline');
          if (outlines.length > 0) {
            const outline = outlines.item(0);
            const o = this.Value(outline);
            data.outline = Boolean(o);
          }
        }
        if (iconStyles.length > 0) {
          const iconStyle = iconStyles.item(0);
          const icon = this.Value(iconStyle);
          data.icon = icon;
        }
      }
    }
    return data;
  }
  /* eslint-enable max-depth, max-statements */

  /* eslint-disable */
  ParseDomItems(xmlDom, tag) {
    const tagName = tag || 'Point';
    const items = [];
    const markerDomNodes = xmlDom.getElementsByTagName(tagName);
    for (let i = 0; i < markerDomNodes.length; i++) {
      const node = markerDomNodes.item(i);
      if (tag === 'GroundOverlay') {
        items.push(node);
        continue;
      }
      const parent =
        node.parentNode.nodeName === 'Placemark'
          ? node.parentNode
          : node.parentNode.parentNode.nodeName === 'Placemark'
            ? node.parentNode.parentNode
            : null;
      if (parent === null) {
        this.log.error([
          'Failed to find ParentNode for Element - ' + tagName,
          {
            node: xmlDom
          }
        ]);
        //  ();
      } else {
        items.push(parent);
      }
    }
    return items;
  }

  // KML Color is defined similar to RGB except it is in the opposite order and starts with opacity,
  // #OOBBGGRR
  convertKMLColorToRGB(colorString) {
    const colorStr = colorString.replace('#', '');
    while (colorStr.length < 6) {
      colorStr = '0' + colorStr;
    } // make sure line is dark!
    while (colorStr.length < 8) {
      colorStr = 'F' + colorStr;
    } // make sure opacity is a large fraction
    if (colorStr.length > 8) {
      colorStr = colorStr.substring(0, 8);
    }
    const color = colorStr.substring(6, 8) + colorStr.substring(4, 6) + colorStr.substring(2, 4);
    const opacity = (parseInt(colorStr.substring(0, 2), 16) * 1.0) / parseInt('FF', 16);

    const rgbVal = {
      color: '#' + color,
      opacity: opacity
    };

    return rgbVal;
  }

  RGBColorToKML(rgb, opacity) {
    const colorStr = rgb.replace('#', '');
    while (colorStr.length < 6) {
      colorStr = '0' + colorStr;
    } //make sure line is dark!
    if (colorStr.length > 6) {
      colorStr = colorStr.substring(0, 6);
    }

    if (opacity != null) {
      if (opacity >= 0.0 && opacity <= 1.0) {
        const opacityNum = opacity;
      } else if (parseInt(opacity) >= 0.0 && parseInt(opacity) <= 1.0) {
        const opacityNum = parseInt(opacity);
      }
    }
    if (opacityNum === null) {
      const opacityNum = 1.0;
    }

    const opacityNum = opacityNum * 255.0;
    const opacityStr = opacityNum.toString(16);

    const kmlStr =
      opacityStr.substring(0, 2) +
      '' +
      colorStr.substring(4, 6) +
      colorStr.substring(2, 4) +
      colorStr.substring(0, 2);

    return kmlStr;
  }

  Value(node) {
    const value = node.nodeValue;
    if (value) return value;
    let str = '';
    try {
      if (node.childNodes && node.childNodes.length) {
        Object.values(this.ChildNodesArray(node)).forEach(c => {
          str += this.Value(c);
        });
      }
    } catch (e) {
      this.log.error(['SimpleKML Parser Exception', e]);
    }
    return str;
  }

  ChildNodesArray(node) {
    const array = [];
    if (node.childNodes && node.childNodes.length > 0) {
      for (let i = 0; i < node.childNodes.length; i++) {
        array.push(node.childNodes.item(i));
      }
    }
    return array;
  }
}
