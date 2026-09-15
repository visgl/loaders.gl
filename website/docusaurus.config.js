// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {resolve} = require('path');
const {version} = require('../package.json');
const {themes} = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;
const legacyMathCoreEntry = require.resolve('@math.gl/core', {
  paths: [resolve('../node_modules/@deck.gl/core')]
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
          {module: /modules[\\/]lerc[\\/]src[\\/]lerc-wasm-url\.ts$/, message: /__dirname/},
          {module: /modules[\\/]parquet[\\/]src[\\/]lib[\\/]utils[\\/]load-wasm-node\.ts$/, message: /__filename/},
          {module: /modules[\\/]parquet[\\/]src[\\/]parquet-source-worker-url\.ts$/, message: /Critical dependency/},
          {module: /modules[\\/]las[\\/]src[\\/]libs[\\/]laz-rs-wasm[\\/]laz_rs_wasm\.js$/, message: /Critical dependency/}
        ],
        plugins: [
          new bundler.DefinePlugin({
            __VERSION__: JSON.stringify(version)
          }),
          new bundler.NormalModuleReplacementPlugin(
            /^web-worker$/,
            resolve('../node_modules/web-worker/src/browser/index.js')
          ),
          new bundler.NormalModuleReplacementPlugin(/env-utils[\\/]version$/, resource => {
            const normalizedContext = resource.context?.replace(/\\/g, '/');
            if (normalizedContext?.includes('/modules/worker-utils/src')) {
              resource.request = resolve('./src/shims/loadersgl-worker-version.js');
            }
          }),
          new bundler.NormalModuleReplacementPlugin(/^@math\.gl\/core$/, resource => {
            const normalizedContext = resource.context?.replace(/\\/g, '/');
            if (
              normalizedContext?.includes('/node_modules/@deck.gl/') ||
              normalizedContext?.includes('/node_modules/@luma.gl/')
            ) {
              // deck.gl/luma.gl 9.3 publish code compiled against math.gl 4.x.
              resource.request = legacyMathCoreEntry;
            }
          }),
          new bundler.NormalModuleReplacementPlugin(/^\.\/lerc\.js$/, resource => {
            const normalizedContext = resource.context?.replace(/\\/g, '/');
            if (normalizedContext?.endsWith('/node_modules/geotiff/dist-module/compression')) {
              resource.request = resolve('./src/shims/geotiff-lerc-decoder.js');
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
          fallback: {path: false, fs: false, buffer: true},
          modules: [resolve('node_modules'), resolve('../node_modules')],
          alias: {
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

            '@loaders.gl/3d-tiles': resolve('../modules/3d-tiles/src'),
            '@loaders.gl/arrow': resolve('../modules/arrow/src'),
            '@loaders.gl/avro': resolve('../modules/avro/src'),
            '@loaders.gl/bson': resolve('../modules/bson/src'),
            '@loaders.gl/compression': resolve('../modules/compression/src'),
            '@loaders.gl/config': resolve('../modules/config/src'),
            '@loaders.gl/copc': resolve('../modules/copc/src'),
            '@loaders.gl/core': resolve('../modules/core/src'),
            '@loaders.gl/crypto': resolve('../modules/crypto/src'),
            '@loaders.gl/csv': resolve('../modules/csv/src'),
            '@loaders.gl/deck-layers': resolve('../modules/deck-layers/src'),
            '@loaders.gl/draco': resolve('../modules/draco/src'),
            '@loaders.gl/excel': resolve('../modules/excel/src'),
            '@loaders.gl/flatgeobuf': resolve('../modules/flatgeobuf/src'),
            '@loaders.gl/geopackage': resolve('../modules/geopackage/src'),
            '@loaders.gl/geotiff': resolve('../modules/geotiff/src'),
            '@loaders.gl/geoarrow': resolve('../modules/geoarrow/src'),
            '@loaders.gl/gis': resolve('../modules/gis/src'),
            '@loaders.gl/gltf': resolve('../modules/gltf/src'),
            '@loaders.gl/i3s': resolve('../modules/i3s/src'),
            '@loaders.gl/images': resolve('../modules/images/src'),
            '@loaders.gl/json': resolve('../modules/json/src'),
            '@loaders.gl/kml': resolve('../modules/kml/src'),
            '@loaders.gl/las': resolve('../modules/las/src'),
            '@loaders.gl/lerc': resolve('../modules/lerc/src'),
            '@loaders.gl/loader-utils': resolve('../modules/loader-utils/src'),
            '@loaders.gl/mlt': resolve('../modules/mlt/src'),
            '@loaders.gl/mvt': resolve('../modules/mvt/src'),
            '@loaders.gl/netcdf': resolve('../modules/netcdf/src'),
            '@loaders.gl/obj': resolve('../modules/obj/src'),
            '@loaders.gl/parquet': resolve('../modules/parquet/src'),
            '@loaders.gl/orc': resolve('../modules/orc/src'),
            '@loaders.gl/pcd': resolve('../modules/pcd/src'),
            '@loaders.gl/ply': resolve('../modules/ply/src'),
            '@loaders.gl/pmtiles': resolve('../modules/pmtiles/src'),
            '@loaders.gl/polyfills': resolve('../modules/polyfills/src'),
            '@loaders.gl/potree': resolve('../modules/potree/src'),
            '@loaders.gl/scan': resolve('../modules/scan/src'),
            '@loaders.gl/schema': resolve('../modules/schema/src'),
            '@loaders.gl/schema-utils': resolve('../modules/schema-utils/src'),
            '@loaders.gl/scene': resolve('../modules/scene/src'),
            '@loaders.gl/shapefile': resolve('../modules/shapefile/src'),
            '@loaders.gl/splats': resolve('../modules/splats/src'),
            '@loaders.gl/stac': resolve('../modules/stac/src'),
            '@loaders.gl/sql': resolve('../modules/sql/src'),
            '@loaders.gl/terrain': resolve('../modules/terrain/src'),
            '@loaders.gl/textures': resolve('../modules/textures/src'),
            '@loaders.gl/tile-converter': resolve('../apps/tile/converter/src-'),
            '@loaders.gl/tiles': resolve('../modules/tiles/src'),
            '@loaders.gl/tiles-2d': resolve('../modules/tiles-2d/src'),
            '@loaders.gl/traces': resolve('../modules/traces/src'),
            '@loaders.gl/type-analyzer': resolve('../modules/type-analyzer/src'),
            '@loaders.gl/video': resolve('../modules/video/src'),
            '@loaders.gl/wkt': resolve('../modules/wkt/src'),
            '@loaders.gl/wms': resolve('../modules/wms/src'),
            '@loaders.gl/services': resolve('../modules/services/src'),
            '@loaders.gl/worker-utils': resolve('../modules/worker-utils/src'),
            '@loaders.gl/xml': resolve('../modules/xml/src'),
            '@loaders.gl/zarr': resolve('../modules/zarr/src'),
            '@loaders.gl/zip': resolve('../modules/zip/src'),
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
              test: /laz-perf\.wasm$/,
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
          const pageRedirects = {
            '/examples/flatgeobuf': '/examples/geospatial/flatgeobuf',
            '/examples/geoarrow': '/examples/geospatial/geoarrow',
            '/examples/geoparquet': '/examples/geospatial/geoparquet',
            '/examples/geojson': '/examples/geospatial/geojson',

            '/docs/modules/parquet/benchmarks': '/docs/modules/parquet/api-reference/parquet-loader',
            '/docs/modules/parquet/api-reference/parquet-js-loader': '/docs/modules/parquet/api-reference/parquet-loader',
            '/docs/modules/parquet/api-reference/parquet-js-writer': '/docs/modules/parquet/api-reference/parquet-writer',

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
