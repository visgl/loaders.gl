// loaders.gl, MIT license

import {Tiles3DService} from '@loaders.gl/tiles';
import {I3SLoader} from '../i3s-loader';

/**
 * Layout guidelines for ArcGIS attribution.
 * @see https://developers.arcgis.com/documentation/mapping-apis-and-services/deployment/basemap-attribution/
 * Custom layout guidelines for ArcGIS attribution.
 * @see https://developers.arcgis.com/documentation/mapping-apis-and-services/deployment/basemap-attribution/#layout-and-design-guidelines
 */
export class ArcGISI3SService extends Tiles3DService {
  id = 'arcgis';
  name = 'ArcGIS';
  urlKey = 'arcgis';
  attribution = {
    title: 'Powered by Esri.',
    url: 'https://arcgis.com/'
  };

  loader = I3SLoader;

  async getAssetCatalog(): Promise<unknown[]> {
    return [];
  }

  async getMetadata(): Promise<any> {
    const response = await fetch(this.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${this.name} ${response.status}`);
    }
    return {name: this.name, ...(await response.json())};
  }
}
