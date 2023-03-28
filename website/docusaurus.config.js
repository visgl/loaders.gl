// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const webpack = require('webpack');
const {resolve} = require('path');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'loaders.gl',
  tagline: 'A collection of loaders modules for Geospatial and 3D visualization use cases',
  url: 'https://loaders.gl',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: '/favicon.png',
  organizationName: 'uber-web', // Usually your GitHub org/user name.
  projectName: 'loaders.gl', // Usually your repo name.
  trailingSlash: false,

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: '../docs',
          sidebarPath: resolve('./src/docs-sidebar.js'),
          // Point to to the website directory in your repo.
          editUrl: 'https://github.com/uber-web/loaders.gl/tree/master/website',
        },
        theme: {
          customCss: [
            resolve('./src/styles.css'),
            // resolve('./node_modules/maplibre-gl/dist/maplibre-gl.css')
          ],
        },
      }),
    ]
  ],

  plugins: [
    [
      './ocular-docusaurus-plugin',
      {
        debug: true,
        resolve: {
          modules: [resolve('node_modules'), resolve('../node_modules')],
          alias: {
            'website-examples': resolve('../examples'),

            '@loaders.gl/3d': resolve('../modules/3d-tiles'),
            '@loaders.gl/arrow': resolve('../modules/arrow'),
            '@loaders.gl/compression': resolve('../modules/compression'),
            '@loaders.gl/core': resolve('../modules/core'),
            '@loaders.gl/crypto': resolve('../modules/crypto'),
            '@loaders.gl/csv': resolve('../modules/csv'),
            '@loaders.gl/draco': resolve('../modules/draco'),
            '@loaders.gl/excel': resolve('../modules/excel'),
            '@loaders.gl/flatgeobuf': resolve('../modules/flatgeobuf'),
            '@loaders.gl/geopackage': resolve('../modules/geopackage'),
            '@loaders.gl/geotiff': resolve('../modules/geotiff'),
            '@loaders.gl/gis': resolve('../modules/gis'),
            '@loaders.gl/gltf': resolve('../modules/gltf'),
            '@loaders.gl/i3s': resolve('../modules/i3s'),
            '@loaders.gl/images': resolve('../modules/images'),
            '@loaders.gl/json': resolve('../modules/json'),
            '@loaders.gl/kml': resolve('../modules/kml'),
            '@loaders.gl/las': resolve('../modules/las'),
            '@loaders.gl/loader': resolve('../modules/loader-utils'),
            '@loaders.gl/math': resolve('../modules/math'),
            '@loaders.gl/mvt': resolve('../modules/mvt'),
            '@loaders.gl/netcdf': resolve('../modules/netcdf'),
            '@loaders.gl/obj': resolve('../modules/obj'),
            '@loaders.gl/parquet': resolve('../modules/parquet'),
            '@loaders.gl/pcd': resolve('../modules/pcd'),
            '@loaders.gl/ply': resolve('../modules/ply'),
            '@loaders.gl/polyfills': resolve('../modules/polyfills'),
            '@loaders.gl/potree': resolve('../modules/potree'),
            '@loaders.gl/schema': resolve('../modules/schema'),
            '@loaders.gl/shapefile': resolve('../modules/shapefile'),
            '@loaders.gl/stac': resolve('../modules/stac'),
            '@loaders.gl/terrain': resolve('../modules/terrain'),
            '@loaders.gl/textures': resolve('../modules/textures'),
            '@loaders.gl/tile': resolve('../modules/tile-converter'),
            '@loaders.gl/tiles': resolve('../modules/tiles'),
            '@loaders.gl/tiles-2d': resolve('../modules/tiles-2d'),
            '@loaders.gl/type': resolve('../modules/type-analyzer'),
            '@loaders.gl/video': resolve('../modules/video'),
            '@loaders.gl/wkt': resolve('../modules/wkt'),
            '@loaders.gl/wms': resolve('../modules/wms'),
            '@loaders.gl/worker': resolve('../modules/worker-utils'),
            '@loaders.gl/xml': resolve('../modules/xml'),
            '@loaders.gl/zarr': resolve('../modules/zarr'),
            '@loaders.gl/zip': resolve('../modules/zip')
          }
        },
        plugins: [
          // new webpack.EnvironmentPlugin(['MapboxAccessToken', 'GoogleMapsAPIKey', 'GoogleMapsMapId']),
          // These modules break server side bundling
          new webpack.IgnorePlugin({
            resourceRegExp: /asciify-image/
          })
        ],
        module: {
          rules: [
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
        docItemComponent: resolve('./src/components/example/doc-item-component.jsx')
      },
    ]
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'loaders.gl',
        logo: {
          alt: 'vis.gl Logo',
          src: 'images/visgl-logo-dark.png',
        },
        items: [
          {
            to: '/examples',
            position: 'left',
            label: 'Examples',
          },
          {
            to: '/docs',
            position: 'left',
            label: 'Docs',
          },
          // {
          //   to: '/showcase',
          //   position: 'left',
          //   label: 'Showcase',
          // },
          {
            to: 'https://medium.com/vis-gl',
            label: 'Blog',
            position: 'left'
          },
          {
            href: 'https://github.com/uber-web/loaders.gl',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Other vis.gl Libraries',
            items: [
              {
                label: 'deck.gl',
                href: 'https:/deck.gl',
              },
              {
                label: 'luma.gl',
                href: 'https://luma.gl',
              },
              {
                label: 'math.gl',
                href: 'https://math.gl',
              },
              {
                label: 'vis.gl',
                href: 'https://vis.gl',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'deck.gl slack',
                href: 'https://join.slack.com/t/deckgl/shared_invite/zt-7oeoqie8-NQqzSp5SLTFMDeNSPxi7eg',
              },
              {
                label: 'vis.gl blog on Medium',
                href: 'https://medium.com/vis-gl',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/uber-web/loaders.gl',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} OpenJS Foundation`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
