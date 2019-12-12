const resolve = require('path').resolve;

const DOC_TABLE_OF_CONTENTS = require('../docs/table-of-contents.json');

const GATSBY_CONFIG = {
  plugins: [
    {
      resolve: `gatsby-theme-ocular`,
      options: {
        logLevel: 1, // Adjusts amount of debug information from ocular-gatsby

        // Folders
        DIR_NAME: `${__dirname}`,
        ROOT_FOLDER: `${__dirname}/../`,

        DOCS: DOC_TABLE_OF_CONTENTS,
        DOC_FOLDERS: [
          `${__dirname}/../docs/`,
          `${__dirname}/../modules/`,
          `${__dirname}/../arrowjs/`
        ],

        PROJECT_TYPE: 'github',

        PROJECT_NAME: 'loaders.gl',
        PROJECT_ORG: 'uber-web',
        PROJECT_URL: 'https://github.com/uber-web/loaders.gl',
        PROJECT_DESC: 'Loaders for Big Data Visualization',
        PATH_PREFIX: '/',

        FOOTER_LOGO: '',

        GA_TRACKING: null,

        // For showing star counts and contributors.
        // Should be like btoa('YourUsername:YourKey') and should be readonly.
        GITHUB_KEY: null,

        HOME_PATH: '/',

        HOME_HEADING: 'Loaders for Big Data Visualization',

        HOME_RIGHT: null,

        HOME_BULLETS: [
          {
            text: 'A collection of the best open source loaders',
            desc: 'Parsers and encoders for many major 3D, geospatial and tabular formats.',
            img: 'images/icon-high-precision.svg'
          },
          {
            text: 'Framework Agnostic',
            desc: 'Loaders and Writers can be used with any visualization framework.',
            img: 'images/icon-high-precision.svg'
          },
          {
            text: 'Works in Browser, Worker Threads and Node.js',
            desc: 'Move your code around and rely on your loaders to keep working.',
            img: 'images/icon-high-precision.svg'
          }
        ],

        PROJECTS: [
          {
            name: 'deck.gl',
            url: 'https://deck.gl'
          },
          {
            name: 'luma.gl',
            url: 'https://luma.gl'
          },
          {
            name: 'react-map-gl',
            url: 'https://uber.github.io/react-map-gl'
          },
          {
            name: 'nebula.gl',
            url: 'https://nebula.gl/'
          }
        ],

        LINK_TO_GET_STARTED: 'docs/developer-guide/get-started',

        ADDITIONAL_LINKS: [],

        INDEX_PAGE_URL: resolve(__dirname, './templates/index.jsx'),

        EXAMPLES: [
          // {
          //   title: 'Point Clouds & Meshes',
          //   image: 'images/example-pointcloud.png',
          //   componentUrl: resolve(__dirname, '../examples/pointcloud/app.js'),
          //   path: 'examples/pointcloud'
          // },
          {
            title: '3D Tiles',
            image: 'images/example-3d-tiles.png',
            componentUrl: resolve(__dirname, '../examples/deck.gl/3d-tiles/app.js'),
            path: 'examples/3d-tiles'
          },
          {
            title: 'glTF',
            image: 'images/example-gltf.jpg',
            componentUrl: resolve(__dirname, './templates/example-gltf.jsx'),
            path: 'examples/gltf'
          }
        ]
      }
    },
    {resolve: 'gatsby-plugin-no-sourcemaps'}
  ]
};

module.exports = GATSBY_CONFIG;
