const resolve = require('path').resolve;

const DOCS = require('../docs/table-of-contents.json');
const DEPENDENCIES = require('./package.json').dependencies;
// eslint-disable-next-line import/no-extraneous-dependencies
const ALIASES = require('ocular-dev-tools/config/ocular.config')({
  root: resolve(__dirname, '..')
}).aliases;

// When duplicating example dependencies in website, autogenerate
// aliases to ensure the website version is picked up
// NOTE: module dependencies are automatically injected
// TODO - should this be automatically done by ocular-gatsby?
const dependencyAliases = {};
for (const dependency in DEPENDENCIES) {
  dependencyAliases[dependency] = `${__dirname}/node_modules/${dependency}`;
}

module.exports = {
  logLevel: 4, // Adjusts amount of debug information from ocular-gatsby

  DOC_FOLDER: `${__dirname}/../docs/`,
  ROOT_FOLDER: `${__dirname}/../`,
  DIR_NAME: `${__dirname}`,

  DOCS,

  // TODO/ib - from ocular, deduplicate with above settings
  PROJECT_TYPE: 'github',

  PROJECT_NAME: 'loaders.gl',
  PROJECT_ORG: 'uber-web',
  PROJECT_URL: 'https://github.com/uber-web/loaders.gl',
  PROJECT_DESC: 'Framework Agnostic Loaders for Data Visualization',
  PATH_PREFIX: '/',

  FOOTER_LOGO: '',

  GA_TRACKING: null,

  // For showing star counts and contributors.
  // Should be like btoa('YourUsername:YourKey') and should be readonly.
  GITHUB_KEY: null,

  HOME_PATH: '/',

  HOME_HEADING: 'Framework Agnostic Loaders for Data Visualization',

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

  ADDITIONAL_LINKS: [],

  INDEX_PAGE_URL: resolve(__dirname, './templates/index.jsx'),

  EXAMPLES: [
    {
      title: 'Point Clouds & Meshes',
      image: 'images/example-pointcloud.png',
      componentUrl: resolve(__dirname, '../examples/pointcloud/app.js'),
      path: 'examples/pointcloud'
    },
    {
      title: '3D Tiles',
      image: 'images/example-3d-tiles.png',
      componentUrl: resolve(__dirname, '../examples/3d-tiles/app.js'),
      path: 'examples/3d-tiles'
    },
    {
      title: 'glTF',
      image: 'images/example-gltf.jpg',
      componentUrl: resolve(__dirname, './templates/example-gltf.jsx'),
      path: 'examples/gltf'
    }
  ],

  // Ocular adds this to gatsby's webpack config
  webpack: {
    resolve: {
      alias: Object.assign({}, ALIASES, dependencyAliases, {
        // Do not build big dependencies from source
        // '@loaders.gl/las': '/Users/ib/Documents/loaders.gl/modules/las',
        // '@loaders.gl/draco': '/Users/ib/Documents/loaders.gl/modules/draco',
      })
    }
  }
};
