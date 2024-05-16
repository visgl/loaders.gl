# WMSService

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-3.3" />
</p>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

The `WMSService` class helps applications interact with a WMS service (discover its capabilities, request map images and information about geospatial features, etc).

The `WMSService` provides a type safe API that forms valid WMS URLs and issues requests, handles WMS version differences and edge cases under the hood and parses results and errors into strongly typed JavaScript objects.

The `WMSService` implements the `ImageService` interface, allowing WMS services to be used as one interchangeable source of asynchronously generated map image data.

## Usage

A `WMSService` instance provides type safe methods to send requests to a WMS service and parse the responses: 

```typescript
  const wmsService = new WMSService({url: WMS_SERVICE_URL, wmsParameters: {layers: ['oms']}});
  const mapImage = await wmsService.getMap({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75]
  });
  // Render mapImage...
```

Capabilities metadata can be queried: 
```typescript
  const wmsService = new WMSService({url: WMS_SERVICE_URL});
  const capabilities = await wmsService.getCapabilities({});
  // Check capabilities
```

The WMS version as well as other default WMS parameters can be specified in the constructor

```typescript
  // Specify the older 1.1.1 version (1.3.0 is the default)
  const wmsService = new WMSService({url: WMS_SERVICE_URL, version: '1.1.1', layers: ['oms']});
  const getMap = await wmsService.getMap({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    
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

For special use cases, is possible to use the `WMSService` to just generate URLs, so that the application issue its own requests and parse responses.

```typescript
  const wmsService = new WMSService({url: WMS_SERVICE_URL});
  const getMapUrl = await wmsService.getMapURL({
    width: 800,
    height: 600,
    bbox: [30, 70, 35, 75],
    layers: ['oms']
  });
  const response = await myCustomFetch(getMapURL);
  // parse...
```


## Methods
  
### constructor()

Creates a `WMSService` instance

```typescript
export type WMSServiceProps = {
  url: string; // Base URL to the service
  loadOptions?: LoaderOptions; // Any load options to the loaders.gl Loaders used by the WMSService methods
  substituteCRS84?: boolean; // In WMS 1.3.0, replaces EPSG:4326 with CRS:84 to ensure lng,lat axis order. Default true.

  wmsParameters: {
    // Default WMS parameters can be provided here
    version?: '1.3.0' | '1.1.1'; /** WMS version */
    layers?: string[]; /** Layers to render */
    query_layers?: string[]; /** Layers to query */
    crs?: string; /** CRS for the image (not the bounding box) */
    format?: 'image/png'; /** Requested format for the return image */
    info_format?: 'text/plain' | 'application/vnd.ogc.gml'; /** Requested MIME type of returned feature info */
    styles?: unknown; /** Styling */
    transparent?: boolean; /** Render transparent pixels if no data */
  },
  vendorParameters
};

constructor(props: WMSServiceProps)
```

### getCapabilities()

Get Capabilities

```typescript
  async getCapabilities(
    wmsParameters?: WMSGetCapabilitiesParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSCapabilities>
```

Returns a capabilities objects. See [`WMSCapabilitiesLoader`][/docs/modules/wms/api-reference/wms-capabilities-loader] for detailed information about the `WMSCapabilities` type.

### getMap()

Get a map image

```typescript
  async getMap(wmsParameters: WMSGetMapParameters, vendorParameters?: Record<string, unknown>): Promise<ImageType>
```

```typescript
export type WMSGetMapParameters = {
  bbox: [number, number, number, number]; // bounding box of the requested map image 
  width: number; // pixel width of returned image 
  height: number; // pixels 

  // constructor parameters can be overridden in the actual calls
  layers?: string | string[]; // Layers to render 
  styles?: unknown; // Styling 
  crs?: string; // crs for the image (not the bounding box) 
  format?: 'image/png'; // requested format for the return image 
};
```

### getFeatureInfo()

> This request is not supported by all WNS servers. Use `getCapabilities()` to determine if it is.

Get Feature Info for a coordinate

```typescript
  async getFeatureInfo(
    wmsParameters: WMSGetFeatureInfoParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSFeatureInfo>
```

```typescript
// https://imagery.pasda.psu.edu/arcgis/services/pasda/UrbanTreeCanopy_Landcover/MapServer/WmsServer?SERVICE=WMS&
export type WMSGetFeatureInfoParameters = {
  x: number; // x coordinate for the feature info request
  y: number; // y coordinate for the feature info request
  query_layers: string[]; // list of layers to query (could be different from rendered layers)
  info_format?: 'text/plain' | 'application/geojson' | 'application/vnd.ogc.gml'; // MIME type of returned feature info
  layers: string[]; // Layers to render
  styles?: unknown; // Styling
  bbox: [number, number, number, number]; // bounding box of the requested map image
  width: number; // pixel width of returned image
  height: number; // pixels
  crs?: string; // crs for the image (not the bounding box)
  format?: 'image/png'; // requested format for the return image
};
```

### describeLayer()

> This request is not supported by all WNS servers. Use `getCapabilities()` to determine if it is.

Get more information about a layer. 

```typescript
  async describeLayer(
    wmsParameters: WMSDescribeLayerParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSLayerDescription>
```

```typescript
export type WMSDescribeLayerParameters = {
  layer: string; // Layer to describe
};
```

### getLegendGraphic()

> This request is not supported by all WMS servers. Use `getCapabilities()` to determine if it is.

Get an image with a semantic legend

```typescript
  async getLegendGraphic(
    wmsParameters: WMSGetLegendGraphicParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<ImageType>
```

```typescript
export type WMSGetLegendGraphicParameters = {
};
```

## Limitations

The `WMSService` only supports WMS URL parameters generation and HTTP GET requests against a WMS server. The OGC WMS standard also allows WMS services to accept XML payloads with HTTP POST messages, however generation of such XML payloads is not supported.
 

