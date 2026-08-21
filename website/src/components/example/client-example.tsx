import BrowserOnly from '@docusaurus/BrowserOnly';
import React, {
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
  Suspense
} from 'react';

/** Website example applications that can be loaded on demand. */
export type ClientExampleKind =
  | '3d-tiles'
  | 'benchmarks'
  | 'geospatial'
  | 'geotiff'
  | 'gltf'
  | 'home'
  | 'i3s-building-scene-layer'
  | 'i3s-colorization-by-attributes'
  | 'i3s-picking'
  | 'ometiff'
  | 'overture-parquet'
  | 'textures'
  | 'tiles'
  | 'wms';

/** Props for a lazily loaded client-only website example. */
export type ClientExampleProps = {
  /** Example application to load. */
  kind: ClientExampleKind;
  /** Content rendered while the browser downloads the example application. */
  fallback?: ReactNode;
  /** Content forwarded to the example application. */
  children?: ReactNode;
  /** Additional props forwarded to the example application. */
  [propName: string]: unknown;
};

type ClientExampleComponent = LazyExoticComponent<ComponentType<any>>;

const CLIENT_EXAMPLE_COMPONENTS: Record<ClientExampleKind, ClientExampleComponent> = {
  '3d-tiles': React.lazy(() => import('examples/website/3d-tiles/app')),
  benchmarks: React.lazy(() => import('../../examples/benchmarks-app')),
  geospatial: React.lazy(() => import('examples/website/geospatial/app')),
  geotiff: React.lazy(() => import('examples/website/geotiff/app')),
  gltf: React.lazy(() => import('../../examples/gltf-demo-app')),
  home: React.lazy(() => import('../../examples/home-demo')),
  'i3s-building-scene-layer': React.lazy(
    () => import('examples/website/i3s-building-scene-layer/src/app')
  ),
  'i3s-colorization-by-attributes': React.lazy(
    () => import('examples/website/i3s-colorization-by-attributes/src/app')
  ),
  'i3s-picking': React.lazy(() => import('examples/website/i3s-picking/src/app')),
  ometiff: React.lazy(() => import('examples/website/ometiff/app')),
  'overture-parquet': React.lazy(() => import('examples/website/overture-parquet/app')),
  textures: React.lazy(() => import('examples/website/textures/app')),
  tiles: React.lazy(() => import('examples/website/tiles/app')),
  wms: React.lazy(() => import('examples/website/wms/app'))
};

/**
 * Loads only the active example application after the page mounts in the browser.
 *
 * Keeping example applications behind this boundary prevents Docusaurus route prefetching from
 * downloading every example linked in a visible sidebar.
 */
export function ClientExample({kind, fallback, ...exampleProps}: ClientExampleProps): ReactNode {
  const ExampleComponent = CLIENT_EXAMPLE_COMPONENTS[kind];
  const loadingFallback = fallback ?? <div style={{height: '100%'}} />;

  return (
    <BrowserOnly fallback={loadingFallback}>
      {() => (
        <Suspense fallback={loadingFallback}>
          <ExampleComponent {...exampleProps} />
        </Suspense>
      )}
    </BrowserOnly>
  );
}
