I3S recipe · conformance

![](/next/images/format-logos/ogc-mark.svg)OGCI3S

# Inspect the profile before you render it.

Use the I3S profile gallery to inspect service metadata, versions, spatial references, and conservative feature support before sending a layer into a renderer.

[Open profile gallery](https://loaders.gl/next/examples/i3s-profile-gallery)

<!-- -->

[ ↗](https://loaders.gl/next/examples/i3s-profile-gallery)[I3S format](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)[I3S module](https://loaders.gl/next/docs/modules/tiles-3d/i3s.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s.md)

What the gallery answers

## Find out what a layer is before choosing a renderer.

I3S services can expose different profiles and generations. The gallery makes those differences visible as metadata, so an application can select a safe path instead of discovering limitations during traversal.

01

Profiles

3D Object, Integrated Mesh, Building, Point, and Point Cloud.

02

Metadata

Version, spatial reference, capabilities, and support report.

03

Raw access

Original layer documents remain available to advanced consumers.

04

Rendering

Use the companion recipes after the layer shape is understood.

Detailed guide

## Profile inspection and source usage

The reference below shows the normalized source facade, profile fields, and links to rendering recipes and conformance fixtures.

The [I3S profile gallery](https://loaders.gl/next/examples/i3s-profile-gallery) is a metadata-first example for checking SceneServer layers across the supported I3S families. It uses the same normalized service facade as applications and keeps the original layer document available for advanced consumers.

```
import {ArcGISSceneServerSource} from '@loaders.gl/arcgis/bundled';



const source = new ArcGISSceneServerSource(

  'https://example.com/arcgis/rest/services/City/SceneServer/layers/0'

);

const metadata = await source.getMetadata();

console.log(metadata.profile, metadata.version, metadata.supportReport);
```

The gallery presents 3D Object, Integrated Mesh, Building, Point, and Point Cloud as separate profiles. Enter a SceneServer layer URL to inspect its version, spatial reference, capabilities, and conservative feature report. Renderer, Arcade, label, and popup expressions are intentionally shown as metadata: evaluating them belongs in the application or rendering layer.

For rendering examples, see [Building Scene Layer](https://loaders.gl/next/docs/modules/tiles-3d/i3s/recipes/building-scene-layer.md), [I3S picking](https://loaders.gl/next/docs/modules/tiles-3d/i3s/recipes/picking.md), and [attribute colorization](https://loaders.gl/next/docs/modules/tiles-3d/i3s/recipes/attribute-driven-colorization.md). The checked-in version/profile fixtures used by conformance tests are listed in the [`I3S_CONFORMANCE_PROFILES`](https://github.com/visgl/loaders.gl/blob/master/modules/tiles-3d/src/i3s/i3s-conformance.ts).
