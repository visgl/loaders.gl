# WMSService

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-3.3" />
	<img src="https://img.shields.io/badge/-BETA-teal.svg" alt="BETA" />
</p>

Among other things, the `WMSService` class provides: 
- type safe method to request and parse the capabilities metadata of a WMS service
- type safe methods to call and parse results (and errors) from a WMS service's endpoints
- type safe methods to form URLs to a WMS service
- an implementation of the `ImageService` interface, allowing WMS services to be used as one interchangeable type of map image data source.

> The `WMSService` generates URLs with URL parameters intended to be used with HTTP GET requests against a WMS server. The OGC WMS standard also allows WMS services to accept XML payloads with HTTP POST messages, however generation of such XML payloads is not supported by this class.
 
## Usage

A `WMSService` once created provides type safe methods that make calls to the service and parse the responses: 
```typescript
  const wmsService = new WMSService({url: WMS_SERVICE_URL});
  const mapImage = await wmsService.getMap({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms']
  });
  // Render mapImage...
```

Capabilities metadata can be queried: 
```typescript
  const wmsService = new WMSService({url: WMS_SERVICE_URL});
  const capabilities = await wmsService.getCapabilities({});
  // Check capabilities
```

It is also possible to just generate URLs allowing the app to perform fetching and parsing: 
```typescript
  const wmsService = new WMSService({url: WMS_SERVICE_URL});
  const getMapUrl = await wmsService.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms']
  });
  const response = await fetch(getMapURL);
  // parse...
```

The WMS version as well as other default WMS parameters can be specified in the constructor
```typescript
  const wmsService = new WMSService({url: WMS_SERVICE_URL, version: '1.3.0'});
  const getMap = await wmsService.getMap({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms']
  });
```

Custom fetch options, such as HTTP headers, and loader-specific options can be specified via the 
standard loaders.gl `loadOptions` argument, which is forwarded to all load and parse operations:
```typescript
  const wmsService = new WMSService({url: WMS_SERVICE_URL, loadOptions: {
    fetch: {
      headers: {
        Authentication: 'Bearer abc...'
      }
    }
  }});

  const getMap = await wmsService.getMap({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms']
  });
```

## Fields

### loaders 

A list of loaders used by the WMSService methods

```typescript
readonly loaders = [
  ImageLoader,
  WMSErrorLoader,
  WMSCapabilitiesLoader,
  WMSFeatureInfoLoader,
  WMSLayerDescriptionLoader
];
```

## Methods
  
### constructor(props: WMSServiceProps)

Creates a `WMSService` instance

```typescript
export type WMSServiceProps = {
  url: string; // Base URL to the service
  loadOptions?: LoaderOptions; // Any load options to the loaders.gl Loaders used by the WMSService methods

  // Default WMS parameters
  version?: '1.1.1' | '1.3.0'; /** WMS version */
  layers?: string[]; /** Layers to render */
  srs?: string; /** SRS for the image (not the bounding box) */
  format?: 'image/png'; /** Requested format for the return image */
  info_format?: 'text/plain' | 'application/vnd.ogc.gml'; /** Requested MIME type of returned feature info */
  styles?: unknown; /** Styling */
};
```

### async getCapabilities

Get Capabilities

```typescript
  async getCapabilities(
    wmsParameters?: WMSGetCapabilitiesParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSCapabilities>
```

### async getMap

Get a map image

```typescript
  async getMap(options: WMSGetMapParameters, vendorParameters?: Record<string, unknown>): Promise<ImageType>
```

```typescript
export type WMSGetMapParameters = {
  layers: string | string[]; // Layers to render 
  styles?: unknown; // Styling 
  bbox: [number, number, number, number]; // bounding box of the requested map image 
  width: number; // pixel width of returned image 
  height: number; // pixels 
  srs?: string; // srs for the image (not the bounding box) 
  format?: 'image/png'; // requested format for the return image 
};
```


### async getFeatureInfo

Get Feature Info for a coordinate

```typescript
  async getFeatureInfo(
    options: WMSGetFeatureInfoParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSFeatureInfo>
```

```typescript
// https://imagery.pasda.psu.edu/arcgis/services/pasda/UrbanTreeCanopy_Landcover/MapServer/WmsServer?SERVICE=WMS&
export type WMSGetFeatureInfoParameters = {
  x: number; // x coordinate for the feature info request
  y: number; // y coordinate for the feature info request
  query_layers: string[]; // list of layers to query (could be different from rendered layers)
  info_format?: 'text/plain'; // MIME type of returned feature info

  layers: string[]; // Layers to render
  styles?: unknown; // Styling
  bbox: [number, number, number, number]; // bounding box of the requested map image
  width: number; // pixel width of returned image
  height: number; // pixels
  srs?: string; // srs for the image (not the bounding box)
  format?: 'image/png'; // requested format for the return image
};
```

### async describeLayer

Get more information about a layer

```typescript
  async describeLayer(
    options: WMSDescribeLayerParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSLayerDescription>
```

```typescript
export type WMSDescribeLayerParameters = {
};
```

### async getLegendGraphic

Get an image with a semantic legend

```typescript
  async getLegendGraphic(
    options: WMSGetLegendGraphicParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<ImageType>
```

```typescript
export type WMSGetLegendGraphicParameters = {
};
```

