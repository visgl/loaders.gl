// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {resolve} = require('path');
const {createRequire} = require('node:module');
const {version} = require('../modules/core/package.json');
const {themes} = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;
const legacyMathCoreEntry = require.resolve('@math.gl/core', {
  paths: [resolve('../node_modules/@deck.gl/core')]
});
const legacyMathPolygonEntry = require.resolve('@math.gl/polygon', {
  paths: [resolve('../node_modules/@deck.gl/layers')]
});

/** Creates the existing SWC loader with deterministic styled-components IDs. */
function createJavaScriptLoader(isServer) {
  const {getSwcLoaderOptions, swcLoader} = require('@docusaurus/faster');
  const options = getSwcLoaderOptions({isServer, bundlerName: 'rspack'});
  options.jsc.experimental = {
    plugins: [
      [
        require.resolve('@swc/plugin-styled-components'),
        {
          displayName: true,
          ssr: true
        }
      ]
    ]
  };
  return {loader: swcLoader, options};
}

/** @type {import('@docusaurus/types').Config} */
const siteUrl = process.env.DOCUSAURUS_URL || 'https://loaders.gl';
const baseUrl = process.env.DOCUSAURUS_BASE_URL || '/';

/** Creates loaders.gl's custom plugins using the bundler selected by Docusaurus. */
function createBundlerPlugin() {
  return {
    name: 'loaders-gl-bundler-plugin',
    configureWebpack(_config, _isServer, {currentBundler}) {
      const bundler = currentBundler.instance;
      const developmentWorkerReplacements = [];
      if (process.env.NODE_ENV === 'development' && !_isServer) {
        developmentWorkerReplacements.push(
          new bundler.NormalModuleReplacementPlugin(
            /parquet-source-worker-url$/,
            resolve('./src/shims/parquet-source-worker-url.dev.js')
          ),
          new bundler.NormalModuleReplacementPlugin(
            /parquet-source-worker-factory$/,
            resolve('./src/shims/parquet-source-worker-factory.dev.js')
          ),
          new bundler.NormalModuleReplacementPlugin(
            /loadersgl-worker-hmr$/,
            resolve('./src/shims/loadersgl-worker-hmr.dev.js')
          )
        );
      }
      return {
        // These modules intentionally use Node fallbacks or dynamic WASM paths that are replaced
        // in browser builds. Keep unrelated bundler warnings visible.
        ignoreWarnings: [
          {module: /zstd-codec[\\/]lib[\\/]zstd-codec-binding(?:-wasm)?\.js$/, message: /__dirname/},
          {module: /modules[\\/]las[\\/]src[\\/]libs[\\/]laz-perf[\\/]laz-perf\.ts$/, message: /__dirname/},
          {module: /modules[\\/]raster[\\/]src[\\/]lerc[\\/]lerc-wasm-url\.ts$/, message: /__dirname/},
          {module: /modules[\\/]parquet[\\/]src[\\/]lib[\\/]utils[\\/]load-wasm-node\.ts$/, message: /__filename/},
          {module: /modules[\\/]parquet[\\/]src[\\/]parquet-source-worker-url\.ts$/, message: /Critical dependency/},
          {module: /modules[\\/]las[\\/]src[\\/]libs[\\/]laz-rs-wasm[\\/]laz_rs_wasm\.js$/, message: /Critical dependency/}
        ],
        plugins: [
          require('./plugins/preserve-draco-assets'),
          new bundler.DefinePlugin({
            __VERSION__: JSON.stringify(version)
          }),
          new bundler.NormalModuleReplacementPlugin(
            /^web-worker$/,
            resolve('../node_modules/web-worker/src/browser/index.js')
          ),
          new bundler.NormalModuleReplacementPlugin(/env-utils[\\/]version$/, resource => {
            const normalizedContext = resource.context?.replace(/\\/g, '/');
            if (normalizedContext?.includes('/modules/core/src/worker-utils')) {
              resource.request = resolve('./src/shims/loadersgl-worker-version.js');
            }
          }),
          new bundler.NormalModuleReplacementPlugin(/^@loaders\.gl\/gltf$/, resource => {
            if (resource.context?.replace(/\\/g, '/').includes('/node_modules/')) {
              const publishedEntry = createRequire(resolve(resource.context, '__resolve__.js')).resolve('@loaders.gl/gltf');
              if (publishedEntry.replace(/\\/g, '/').includes('/node_modules/')) {
                resource.request = publishedEntry.replace(/\.cjs$/, '.js');
              }
            }
          }),
          new bundler.NormalModuleReplacementPlugin(/^@math\.gl\/core$/, resource => {
            const normalizedContext = resource.context?.replace(/\\/g, '/');
            if (
              normalizedContext?.includes('/node_modules/@deck.gl/') ||
              normalizedContext?.includes('/node_modules/@luma.gl/') ||
              normalizedContext?.includes('/node_modules/@math.gl/culling/') ||
              normalizedContext?.includes('/node_modules/@math.gl/polygon/')
            ) {
              // deck.gl/luma.gl and their standalone math.gl leaf dependencies require 4.x.
              resource.request = legacyMathCoreEntry;
            }
          }),
          new bundler.NormalModuleReplacementPlugin(/^@math\.gl\/polygon$/, resource => {
            const normalizedContext = resource.context?.replace(/\\/g, '/');
            if (normalizedContext?.includes('/node_modules/@deck.gl/')) {
              // Published deck.gl layers still require the math.gl 4.x WINDING export.
              resource.request = legacyMathPolygonEntry;
            }
          }),
          new bundler.NormalModuleReplacementPlugin(/^\.\/lerc\.js$/, resource => {
            const normalizedContext = resource.context?.replace(/\\/g, '/');
            if (normalizedContext?.endsWith('/node_modules/geotiff/dist-module/compression')) {
              resource.request = resolve('./src/shims/geotiff-lerc-decoder.js');
            }
          }),
          new bundler.NormalModuleReplacementPlugin(/^\.\/lerc-wasm-url$/, resource => {
            const normalizedContext = resource.context?.replace(/\\/g, '/');
            if (normalizedContext?.endsWith('/modules/raster/src/lerc')) {
              resource.request = resolve('./src/utils/lerc-wasm-url.js');
            }
          }),
          ...developmentWorkerReplacements
        ]
      };
    }
  };
}

const config = {
  title: 'loaders.gl',
  tagline: 'Big data loading for the web',
  url: siteUrl,
  baseUrl,
  onBrokenLinks: 'warn',
  favicon: '/favicon.png',
  organizationName: 'visgl', // Usually your GitHub org/user name.
  projectName: 'loaders.gl', // Usually your repo name.
  trailingSlash: false,

  future: {
    v4: true,
    // Use a custom SWC loader below so styled-components receives stable SSR IDs.
    faster: {
      swcJsLoader: false
    }
  },

  webpack: {
    jsLoader: createJavaScriptLoader
  },

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    }
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: '../docs',
          sidebarPath: resolve('./src/docs-sidebar.js'),
          docItemComponent: resolve('./src/components/docs/doc-item.tsx'),
          // Point to to the website directory in your repo.
          editUrl: 'https://github.com/visgl/loaders.gl/tree/master/website'
        },
        theme: {
          customCss: [
            resolve('../node_modules/@deck.gl/widgets/dist/stylesheet.css'),
            resolve('./src/styles.css')
            // resolve('./node_modules/maplibre-gl/dist/maplibre-gl.css')
          ]
        }
      })
    ]
  ],

  plugins: [
    [
      '@signalwire/docusaurus-plugin-llms-txt',
      {
        siteTitle: 'loaders.gl',
        siteDescription:
          'Framework-independent loaders for visualization, 3D graphics and geospatial formats.',
        depth: Math.min(5, 3 + baseUrl.split('/').filter(Boolean).length),
        enableDescriptions: true,
        includeOrder: [
          '/docs/developer-guide/get-started',
          '/docs/developer-guide/**',
          '/docs/modules/**'
        ].map(route => `${baseUrl.replace(/\/$/, '')}${route}`),
        onRouteError: 'throw',
        content: {
          enableMarkdownFiles: true,
          enableLlmsFullTxt: false,
          relativePaths: false,
          includeBlog: false,
          includePages: false,
          includeDocs: true,
          includeVersionedDocs: false,
          includeGeneratedIndex: true,
          excludeRoutes: ['/docs/legacy/**', '/examples/**'].map(
            route => `${baseUrl.replace(/\/$/, '')}${route}`
          )
        }
      }
    ],
    createBundlerPlugin,
    [
      require.resolve('./node-polyfills-docusaurus-plugin'),
      { 
        excludeAliases: ['console']
      }
    ],
    require.resolve('./webpack-plugin'),
    [
      './ocular-docusaurus-plugin',
      {
        debug: true,
        resolve: {
          extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
          // NodeNext source entrypoints name emitted .js files; resolve their TypeScript sources.
          extensionAlias: {'.js': ['.js', '.ts']},
          fallback: {path: false, fs: false, buffer: true},
          modules: [resolve('node_modules'), resolve('../node_modules')],
          alias: {
            '@loaders.gl/tables': resolve('../modules/tables/src'),
            '@loaders.gl/geospatial': resolve('../modules/geospatial/src'),
            examples: resolve('../examples'),
            bufferutil: false,
            'utf-8-validate': false,
            'lerc$': resolve('./src/shims/lerc.js'),
            'web-worker$': resolve('../node_modules/web-worker/src/browser/index.js'),
            'web-worker/src/node/index.js$': resolve('../node_modules/web-worker/src/browser/index.js'),
            'website-geotiff-basedecoder': resolve('../node_modules/geotiff/dist-module/compression/basedecoder.js'),
            'website-geotiff-globals': resolve('../node_modules/geotiff/dist-module/globals.js'),
            'website-lerc-es': resolve('../node_modules/lerc/LercDecode.es.js'),
            'laz-perf$': resolve('./src/utils/laz-perf-with-wasm.js'),

            '@loaders.gl/3d-tiles$': resolve('../modules/tiles-3d/src/3d-tiles'),
            '@loaders.gl/tiles-3d/3d-tiles': resolve('../modules/tiles-3d/src/3d-tiles'),
            '@loaders.gl/tables/arrow/index': resolve('../modules/tables/src/arrow'),
            '@loaders.gl/core/arrow-geometry': resolve('../modules/core/src/arrow-geometry'),
            '@loaders.gl/tables/avro/index': resolve('../modules/tables/src/avro'),
            '@loaders.gl/tables/bson/index': resolve('../modules/tables/src/bson'),
            '@loaders.gl/compression': resolve('../modules/compression/src'),
            '@loaders.gl/config': resolve('../modules/config/src'),
            '@loaders.gl/tiles-3d/copc': resolve('../modules/tiles-3d/src/copc'),
            '@loaders.gl/core/loader-utils': resolve('../modules/core/src/loader-utils'),
            '@loaders.gl/core/worker-utils': resolve('../modules/core/src/worker-utils'),
            '@loaders.gl/core': resolve('../modules/core/src'),
            '@loaders.gl/crypto': resolve('../modules/crypto/src'),
            '@loaders.gl/tables/csv/index': resolve('../modules/tables/src/csv'),
            '@loaders.gl/deck-layers': resolve('../modules/deck-layers/src'),
            '@loaders.gl/draco': resolve('../modules/draco/src'),
            '@loaders.gl/tables/excel/index': resolve('../modules/tables/src/excel'),
            '@loaders.gl/geospatial/flatgeobuf/index': resolve('../modules/geospatial/src/flatgeobuf'),
            '@loaders.gl/geospatial/geopackage/index': resolve('../modules/geospatial/src/geopackage'),
            '@loaders.gl/raster': resolve('../modules/raster/src'),
            '@loaders.gl/raster/geotiff/index': resolve('../modules/raster/src/geotiff/index.ts'),
            '@loaders.gl/core/geoarrow': resolve('../modules/core/src/geoarrow'),
            '@loaders.gl/gltf': resolve('../modules/gltf/src'),
            '@loaders.gl/tiles-3d/i3s': resolve('../modules/tiles-3d/src/i3s'),
            '@loaders.gl/images': resolve('../modules/images/src'),
            '@loaders.gl/tables/json/index': resolve('../modules/tables/src/json'),
            '@loaders.gl/geospatial/kml/index': resolve('../modules/geospatial/src/kml'),
            '@loaders.gl/las': resolve('../modules/las/src'),
            '@loaders.gl/raster/lerc/index': resolve('../modules/raster/src/lerc/index.ts'),
            '@loaders.gl/tiles/mlt': resolve('../modules/tiles/src/mlt'),
            '@loaders.gl/tiles/mvt': resolve('../modules/tiles/src/mvt'),
            '@loaders.gl/scientific': resolve('../modules/scientific/src'),
            '@loaders.gl/obj': resolve('../modules/obj/src'),
            '@loaders.gl/tables/parquet/index': resolve('../modules/tables/src/parquet'),
            '@loaders.gl/tables/orc/index': resolve('../modules/tables/src/orc'),
            '@loaders.gl/pcd': resolve('../modules/pcd/src'),
            '@loaders.gl/ply': resolve('../modules/ply/src'),
            '@loaders.gl/tiles/pmtiles': resolve('../modules/tiles/src/pmtiles'),
            '@loaders.gl/core/polyfills': resolve('../modules/core/src/polyfills'),
            '@loaders.gl/tiles-3d/potree': resolve('../modules/tiles-3d/src/potree'),
            '@loaders.gl/core/scan': resolve('../modules/core/src/scan'),
            '@loaders.gl/core/schema': resolve('../modules/core/src/schema'),
            '@loaders.gl/core/schema-utils': resolve('../modules/core/src/schema-utils'),
            '@loaders.gl/scene': resolve('../modules/scene/src'),
            '@loaders.gl/geospatial/shapefile/index': resolve('../modules/geospatial/src/shapefile'),
            '@loaders.gl/splats': resolve('../modules/splats/src'),
            '@loaders.gl/ogc/stac': resolve('../modules/ogc/src/stac'),
            '@loaders.gl/ogc': resolve('../modules/ogc/src'),
            '@loaders.gl/sql': resolve('../modules/sql/src'),
            '@loaders.gl/raster/terrain/index': resolve('../modules/raster/src/terrain/index.ts'),
            '@loaders.gl/textures': resolve('../modules/textures/src'),
            '@loaders.gl/tile-converter/v5/core': resolve('../apps/tile-converter/src/v5/core.ts'),
            '@loaders.gl/tile-converter/v5/adapters': resolve('../apps/tile-converter/src/v5/adapters.ts'),
            '@loaders.gl/tiles-3d': resolve('../modules/tiles-3d/src'),
            '@loaders.gl/tiles': resolve('../modules/tiles/src'),
            '@loaders.gl/tiles-2d': resolve('../modules/tiles-2d/src'),
            '@loaders.gl/traces': resolve('../modules/traces/src'),
            '@loaders.gl/type-analyzer': resolve('../modules/type-analyzer/src'),
            '@loaders.gl/video': resolve('../modules/video/src'),
            '@loaders.gl/wkt': resolve('../modules/wkt/src'),
            '@loaders.gl/ogc/wms': resolve('../modules/ogc/src/wms'),
            '@loaders.gl/arcgis/arcgis-feature-server-source-loader': resolve('../modules/arcgis/src/arcgis/arcgis-feature-server-source-loader'),
            '@loaders.gl/arcgis/arcgis-image-server-source-loader': resolve('../modules/arcgis/src/arcgis/arcgis-image-server-source-loader'),
            '@loaders.gl/arcgis/arcgis-image-tile-source-loader': resolve('../modules/arcgis/src/arcgis/arcgis-image-tile-source-loader'),
            '@loaders.gl/arcgis/arcgis-map-tile-source-loader': resolve('../modules/arcgis/src/arcgis/arcgis-map-tile-source-loader'),
            '@loaders.gl/arcgis/arcgis-scene-server-source-loader': resolve('../modules/arcgis/src/arcgis/arcgis-scene-server-source-loader'),
            '@loaders.gl/arcgis/arcgis-vector-tile-server-source-loader': resolve('../modules/arcgis/src/arcgis/arcgis-vector-tile-server-source-loader'),
            '@loaders.gl/arcgis/bundled': resolve('../modules/arcgis/src/bundled'),
            '@loaders.gl/arcgis/items': resolve('../modules/arcgis/src/arcgis-items'),
            '@loaders.gl/arcgis/authentication': resolve('../modules/arcgis/src/authentication'),
            '@loaders.gl/arcgis/discovery': resolve('../modules/arcgis/src/arcgis/arcgis-capability-graph'),
            '@loaders.gl/arcgis/scene-aggregation': resolve('../modules/arcgis/src/arcgis/arcgis-scene-aggregation'),
            '@loaders.gl/arcgis': resolve('../modules/arcgis/src'),
            '@loaders.gl/services': resolve('../modules/services/src'),
            '@loaders.gl/xml': resolve('../modules/xml/src'),
            '@loaders.gl/archives/zip': resolve('../modules/archives/src/zip'),
            'sql.js$': require.resolve('sql.js/dist/sql-wasm-browser.js'),

            // '@deck.gl/react': resolve()
            // '@deck.gl/layers'
            // '@deck.gl/react'
            // '@deck.gl/layers'
            // '@deck.gl/react/typed'
            // '@deck.gl/layers/typed'
            // '@deck.gl/react'
            // '@deck.gl/geo-layers'
            // 'marked'
            // 'website-examples/i3s-arcgis/app'
            // 'website-examples/website/i3s/app'
            // '../react-table.css.js'
          }
        },
        module: {
          rules: [
            {
              test: /(?:laz-perf|lerc-wasm)\.wasm$/,
              type: 'asset/resource'
            },
            // https://github.com/Esri/calcite-components/issues/2865
            {
              test: /\.m?js/,
              resolve: {
                fullySpecified: false
              }
            }
          ]
        }
      }
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'examples',
        path: './src/examples',
        routeBasePath: 'examples',
        sidebarPath: resolve('./src/examples-sidebar.js'),
        breadcrumbs: false,
        docItemComponent: resolve('./src/components/example/doc-item-component.tsx')
      }
    ],
    // [
    //   require.resolve('@cmfcmf/docusaurus-search-local'),
    //   {
    //     // Options here
    //   }
    // ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        createRedirects(existingPath) {
          const consolidatedModuleDocs = {
            tables: ['arrow', 'avro', 'bson', 'csv', 'excel', 'json', 'lance', 'orc', 'parquet'],
            geospatial: ['flatgeobuf', 'geopackage', 'kml', 'shapefile'],
            core: ['scan', 'arrow-geometry', 'geoarrow']
          };
          const pageRedirects = {
            '/docs/modules/gis': '/docs/modules/core/geoarrow/gis-migration',
            '/docs/modules/gis/api-reference/geojson-to-binary': '/docs/modules/core/geoarrow/api-reference/convert-geojson-to-binary-feature-collection',
            '/docs/modules/gis/api-reference/binary-to-geojson': '/docs/modules/core/geoarrow/api-reference/convert-binary-feature-collection-to-geojson',
            '/examples/flatgeobuf': '/examples/geospatial/flatgeobuf',
            '/examples/geoarrow': '/examples/geospatial/geoarrow',
            '/examples/geoparquet': '/examples/geospatial/geoparquet',
            '/examples/geojson': '/examples/geospatial/geojson',

            '/docs/modules/parquet/benchmarks': '/docs/modules/tables/parquet/api-reference/parquet-loader',
            '/docs/modules/parquet/api-reference/parquet-js-loader': '/docs/modules/tables/parquet/api-reference/parquet-loader',
            '/docs/modules/parquet/api-reference/parquet-js-writer': '/docs/modules/tables/parquet/api-reference/parquet-writer',

            '/examples/pmtiles': '/examples/tiles/pmtiles',
            '/examples/wms': '/examples/tiles/wms',
          };
          const legacyTryItRedirects = {
            '/examples/table/arrow': '/docs/modules/arrow/try-it',
            '/examples/table/bson': '/docs/modules/bson/try-it',
            '/examples/geospatial/csv': '/docs/modules/csv/try-it',
            '/examples/pointclouds/draco': '/docs/modules/draco/try-it',
            '/examples/geospatial/flatgeobuf': '/docs/modules/flatgeobuf/try-it',
            '/examples/geospatial/geopackage': '/docs/modules/geopackage/try-it',
            '/examples/table/json': '/docs/modules/json/try-it',
            '/examples/geospatial/kml': '/docs/modules/kml/try-it',
            '/examples/pointclouds/las': '/docs/modules/las/try-it',
            '/examples/pointclouds/obj': '/docs/modules/obj/try-it',
            '/examples/geospatial/geoparquet': '/docs/modules/parquet/try-it',
            '/examples/pointclouds/pcd': '/docs/modules/pcd/try-it',
            '/examples/pointclouds/ply': '/docs/modules/ply/try-it',
            '/examples/geospatial/shapefile': '/docs/modules/shapefile/try-it',
            '/examples/table/xml': '/docs/modules/xml/try-it'
          };
          const redirectSources = [];
          for (const [group, formats] of Object.entries(consolidatedModuleDocs)) {
            for (const format of formats) {
              const currentPrefix = `/docs/modules/${group}/${format}`;
              if (existingPath === currentPrefix || existingPath.startsWith(`${currentPrefix}/`)) {
                const oldPath = existingPath.replace(currentPrefix, `/docs/modules/${format}`);
                if (!pageRedirects[oldPath] || pageRedirects[oldPath] === existingPath) {
                  redirectSources.push(oldPath);
                }
              }
            }
          }
          if (legacyTryItRedirects[existingPath]) {
            redirectSources.push(legacyTryItRedirects[existingPath]);
          }
          for (const [oldLink, newLink] of Object.entries(pageRedirects)) {
            if (existingPath.includes(newLink)) {
              redirectSources.push(existingPath.replace(newLink, oldLink));
            }
          }
          if (redirectSources.length) {
            return redirectSources;
          }
          if (pageRedirects[existingPath]) {
            return [pageRedirects[existingPath]];
          }
          // docs/modules/*/api-reference <= modules/*/docs/api-reference
          if (existingPath.includes('/docs/modules/')) {
            return [
              existingPath
                .replace('/docs/modules/', '/modules/')
                // Replaces api-reference if present
                .replace('/api-reference/', '/docs/api-reference/')
            ];
          }
          return undefined; // Return a falsy value: no redirect created
        }
      }
    ]
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false
      },
      navbar: {
        title: 'loaders.gl',
        logo: {
          alt: 'vis.gl Logo',
          src: 'images/visgl-logo-dark.png',
          srcDark: 'images/visgl-logo-light.png'
        },
        items: [
          {
            to: '/docs',
            position: 'left',
            label: 'Docs'
          },
          {
            to: '/examples',
            position: 'left',
            label: 'Examples'
          },
          {
            to: '/showcase',
            position: 'left',
            label: 'Showcases',
          },
          {
            to: 'https://medium.com/vis-gl',
            label: 'Blog',
            position: 'left'
          },
          {
            type: 'html',
            position: 'right',
            value: `<a aria-label="Open Visualization Collaborator Summit" href="https://openvisualization.org" target="_blank" rel="noopener noreferrer" style="content: ''; height: 80px; width: 100px; margin-top: -30px; background-image: url('${baseUrl}images/openjs-foundation.svg'); background-repeat: no-repeat; background-size: 80px 110px; display: flex"></a>`
          },
          {
            href: 'https://github.com/visgl/loaders.gl',
            label: 'GitHub',
            position: 'right'
          }
        ]
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Other vis.gl Libraries',
            items: [
              {
                label: 'vis.gl',
                href: 'https://vis.gl'
              },
              {
                label: 'deck.gl',
                href: 'https://deck.gl'
              },
              {
                label: 'luma.gl',
                href: 'https://luma.gl'
              },
              {
                label: 'math.gl',
                href: 'https://math.gl'
              }
            ]
          },
          {
            title: 'More',
            items: [
              {
                label: 'Open Visualization',
                href: 'https://www.openvisualization.org/'
              },
              {
                label: 'deck.gl slack',
                href: 'https://join.slack.com/t/deckgl/shared_invite/zt-7oeoqie8-NQqzSp5SLTFMDeNSPxi7eg'
              },
              {
                label: 'vis.gl blog on Medium',
                href: 'https://medium.com/vis-gl'
              },
              {
                label: 'GitHub',
                href: 'https://github.com/visgl/loaders.gl'
              }
            ]
          }
        ],
        copyright:
          '<div class="footer-copy">Copyright <a href="https://openjsf.org">OpenJS Foundation</a> and vis.gl contributors. All rights reserved. The <a href="https://openjsf.org">OpenJS Foundation</a> has registered trademarks and uses trademarks. For a list of trademarks of the <a href="https://openjsf.org">OpenJS Foundation</a>, please see our <a href="https://trademark-policy.openjsf.org">Trademark Policy</a> and <a href="https://trademark-list.openjsf.org">Trademark List</a>. Trademarks and logos not indicated on the <a href="https://trademark-list.openjsf.org">list of OpenJS Foundation trademarks</a> are trademarks&trade; or registered&reg; trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.<br><br><a href="https://openjsf.org">The OpenJS Foundation</a> | <a href="https://terms-of-use.openjsf.org">Terms of Use</a> | <a href="https://privacy-policy.openjsf.org">Privacy Policy</a> | <a href="https://bylaws.openjsf.org">Bylaws</a> | <a href="https://code-of-conduct.openjsf.org">Code of Conduct</a> | <a href="https://trademark-policy.openjsf.org">Trademark Policy</a> | <a href="https://trademark-list.openjsf.org">Trademark List</a> | <a href="https://www.linuxfoundation.org/cookies">Cookie Policy</a></div>'
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme
      }
    })
};

module.exports = config;
