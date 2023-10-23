# CSWService

![ogc-logo](../../../images/logos/ogc-logo-60.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-3.4" />
  &nbsp;
	<img src="https://img.shields.io/badge/-BETA-teal.svg" alt="BETA" />
</p>


The `CSWService` class provides a type safe API for what 
- Type safe methods to call and parse results (and errors) from a CSW service's endpoints
- In particular the big `GetCapabilities` metadata is normalized into a fully typed data structure.

> The `CSWService` generates URLs with URL parameters intended to be used with HTTP GET requests against a CSW server. The OGC CSW standard also allows CSW services to accept XML payloads with HTTP POST messages, however generation of such XML payloads is not supported by this class.
 
## Usage

A `CSWService` instance provides type safe methods that make calls to the service and parse the responses.

Get a normalized array of all the services and resources referenced by this catalog server:

```typescript
  const cswService = new CSWService({url: CSW_SERVICE_URL});
  const serviceDirectory = await cswService.getServiceDirectory({includeUnknown: true});
  console.log(serviceDirectory);
```

Capabilities metadata can be queried: 

```typescript
  const cswService = new CSWService({url: CSW_SERVICE_URL});
  const capabilities = await cswService.getCapabilities({});
  // Check capabilities
```

Custom fetch options, such as HTTP headers, and loader-specific options can be specified via the 
standard loaders.gl `loadOptions` argument, which is forwarded to all load and parse operations:
```typescript
  const cswService = new CSWService({url: CSW_SERVICE_URL, loadOptions: {
    fetch: {
      headers: {
        Authentication: 'Bearer abc...'
      }
    }
  }});

  const serviceDirectory = await cswService.getServiceDirectory();
```

## Methods
  
### constructor()

Creates a `CSWService` instance

```typescript
export type CSWServiceProps = {
  url: string; // Base URL to the service
  loadOptions?: LoaderOptions; // Passed to loaders used by CSWService methods
};

constructor(props: CSWServiceProps)
```

### getCapabilities()

Get Capabilities

```typescript
async getCapabilities(
  cswParameters?: CSWGetCapabilitiesParameters,
  vendorParameters?: Record<string, unknown>
): Promise<CSWCapabilities>
```

### getServiceDirectory()

Get a list of all service exposed by this catalog server.

```typescript
async getServiceDirectory(
  options: CSWGetMapParameters, 
  vendorParameters?: Record<string, unknown>
): Promise<Service[]>
```

```typescript
export type CSWGetMapParameters = {
  includeUnknown: boolean; // Include services and resources that loaders.gl cannot handle
};
```
