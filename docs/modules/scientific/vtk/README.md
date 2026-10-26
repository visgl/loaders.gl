# VTK

The `@loaders.gl/scientific/vtk` subpath exports direct parsers for supported legacy and XML VTK
encodings. Install `@loaders.gl/scientific`; there is no separate VTK package.

```ts
import {parseVTKLegacy, parseVTKXML} from '@loaders.gl/scientific/vtk';

const legacyDataset = parseVTKLegacy(legacyText);
const xmlDataset = parseVTKXML(xmlText);
```

| Parser | Current support | Explicit limits |
| --- | --- | --- |
| `parseVTKLegacy` | Legacy ASCII `POLYDATA`, `STRUCTURED_POINTS`, and `UNSTRUCTURED_GRID` subsets | Binary legacy files and unsupported keywords are rejected. |
| `parseVTKXML` | `ImageData`, `UnstructuredGrid`, `PolyData`, `RectilinearGrid`, and `StructuredGrid`; ASCII and inline uncompressed base64 arrays | Compressed and appended arrays are rejected. |

The parsers return typed dataset structures (`VTKDataset` or `VTKXMLDataset`) with geometry and
associated arrays. They are not metadata loaders for core's `load()`; fetch or read text first,
then call the appropriate parser. See the exported TypeScript types for the dataset fields.
