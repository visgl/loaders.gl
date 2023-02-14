# WMSService

The WMSService class provides 
- provides type safe methods to form URLs to a WMS service
- provides type safe methods to query and parse results (and errors) from a WMS service
- implements the ImageService interface

> The WMSService generates URLs decorated with additional parameters intended to be used with simple HTTP GET requests against a WMS server. Generation of XML payloads for the alternative HTTP POST message approach is not supported.
 

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

Creates a WMSService

```typescript
export type WMSServiceProps = {
  url: string; // Base URL to the service
  loadOptions?: LoaderOptions; // Any load options to the loaders.gl Loaders used by the WMSService methods
  fetch?: typeof fetch | FetchLike; // Override the fetch function if required
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

