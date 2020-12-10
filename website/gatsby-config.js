const {resolve} = require('path');
const DOC_TABLE_OF_CONTENTS = require('../docs/table-of-contents.json');

const ROOT_DIR = resolve('..');

module.exports = {
  plugins: [
    {
      resolve: `gatsby-theme-ocular`,
      options: {
        logLevel: 1, // Adjusts amount of debug information from ocular-gatsby

        // Folders
        DIR_NAME: __dirname,
        ROOT_FOLDER: ROOT_DIR,

        DOCS: DOC_TABLE_OF_CONTENTS,
        DOC_FOLDERS: [
          resolve(ROOT_DIR, 'docs'),
          resolve(ROOT_DIR, 'modules'),
          resolve(ROOT_DIR, 'arrowjs')
        ],
        SOURCE: [
          resolve('./static'),
          resolve('./src')
        ],

        PROJECT_TYPE: 'github',

        PROJECT_NAME: 'loaders.gl',
        PROJECT_ORG: 'visgl',
        PROJECT_ORG_LOGO: 'images/visgl-logo.png',
        PROJECT_URL: 'https://github.com/visgl/',
        PROJECT_DESC: 'Loaders for Big Data Visualization',
        PROJECT_IMAGE: 'images/example-gltf.png',
        PATH_PREFIX: '/loaders.gl',

        GA_TRACKING_ID: 'UA-74374017-2',

        // For showing star counts and contributors.
        // Should be like btoa('YourUsername:YourKey') and should be readonly.
        GITHUB_KEY: null,

        HOME_PATH: '/',

        PROJECTS: [
          {
            name: 'vis.gl',
            url: 'https://vis.gl'
          },
          {
            name: 'deck.gl',
            url: 'https://deck.gl'
          },
          {
            name: 'luma.gl',
            url: 'https://luma.gl'
          },
          {
            name: 'nebula.gl',
            url: 'https://nebula.gl/'
          }
        ],

        LINK_TO_GET_STARTED: '/docs/developer-guide/get-started',

        ADDITIONAL_LINKS: [{
          name: 'Blog',
          href: 'http://medium.com/vis-gl',
          index: 4
        }],

        THEME_OVERRIDES: require('./templates/theme.json'),

        STYLESHEETS: ['/style.css'],

        INDEX_PAGE_URL: resolve(__dirname, './templates/index.jsx'),

        EXAMPLES: [
          {
            title: 'Point Cloud Loaders',
            image: 'images/example-pointcloud.jpg',
            componentUrl: resolve(__dirname, '../examples/website/pointcloud/app.js'),
            path: 'examples/pointcloud'
          },
          {
            title: 'glTF Helmet',
            image: 'images/example-gltf.jpg',
            componentUrl: resolve(__dirname, './templates/example-gltf.jsx'),
            path: 'examples/gltf'
          },
          {
            title: '3D Tiles (Melbourne)',
            image: 'images/example-3d-tiles.png',
            componentUrl: resolve(__dirname, '../examples/website/3d-tiles/app.js'),
            path: 'examples/3d-tiles'
          },
          {
            title: 'I3S (San Francisco)',
            image: 'images/example-i3s.jpg',
            componentUrl: resolve(__dirname, '../examples/website/i3s/app.js'),
            path: 'examples/i3s'
          },
          {
            title: 'Benchmarks',
            image: 'images/benchmark.png',
            componentUrl: resolve(__dirname, '../examples/benchmarks/app-website.js'),
            path: 'examples/benchmarks'
          }
        ]
      }
    },
    {resolve: 'gatsby-plugin-no-sourcemaps'}
  ]
};
