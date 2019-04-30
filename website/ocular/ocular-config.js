const resolve = require('path').resolve;

const DOCS = require('../docs/table-of-contents.json');
const DEPENDENCIES = require('./package.json').dependencies;
// eslint-disable-next-line import/no-extraneous-dependencies
const ALIASES = require('ocular-dev-tools/config/ocular.config')({
  root: resolve(__dirname, '../..')
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
  logLevel: 3, // Adjusts amount of debug information from ocular-gatsby

  DOC_FOLDER: `${__dirname}/../docs/`,
  ROOT_FOLDER: `${__dirname}/../`,
  DIR_NAME: `${__dirname}`,

  DOCS,

  // TODO/ib - from ocular, deduplicate with above settings
  PROJECT_TYPE: 'github',

  PROJECT_NAME: 'loaders.gl',
  PROJECT_ORG: 'uber-web',
  PROJECT_URL: 'https://github.com/uber-web/loaders.gl',
  PROJECT_DESC: 'Framework agnostic loaders for visualization assets',
  PATH_PREFIX: '/',

  FOOTER_LOGO: '',

  GA_TRACKING: null,

  // For showing star counts and contributors.
  // Should be like btoa('YourUsername:YourKey') and should be readonly.
  GITHUB_KEY: null,

  HOME_PATH: '/',

  HOME_HEADING: 'Framework agnostic loaders for visualization assets',

  HOME_RIGHT: null,

  HOME_BULLETS: [
    {
      text: 'Designed for Interoperability',
      desc: 'Seamless integration.',
      img: 'images/icon-react.svg'
    },
    {
      text: 'Totally ready for production',
      img: 'images/icon-layers.svg'
    }
  ],

  PROJECTS: [],

  ADDITIONAL_LINKS: [],

  EXAMPLES: [
    // {
    //   title: 'Point Clouds & Meshes',
    //   image: 'images/example-pointcloud.png',
    //   componentUrl: resolve(__dirname, './examples/pointcloud/app.js'),
    //   path: 'examples/pointcloud'
    // },
    // {
    //   title: '3D Tiles',
    //   image: 'images/example-gltf.jpg',
    //   componentUrl: resolve(__dirname, './examples/3d-tiles/app.js'),
    //   path: 'examples/3d-tiles'
    // },
    // {
    //   title: 'GLTF',
    //   image: 'images/example-gltf.jpg',
    //   componentUrl: resolve(__dirname, './templates/example-gltf.jsx'),
    //   path: 'examples/gltf'
    // }
  ],

  // Avoids duplicate conflicting inputs when importing from examples folders
  // Ocular adds this to gatsby's webpack config
  webpack: {
    resolve: {
      // modules: [resolve(__dirname, './node_modules')],
      alias: Object.assign({}, ALIASES, dependencyAliases, {
        //   '@luma.gl/addons': `${__dirname}/node_modules/@luma.gl/addons/src`,
        //   '@luma.gl/core': `${__dirname}/node_modules/@luma.gl/core/src`,
        //   '@luma.gl/constants': `${__dirname}/node_modules/@luma.gl/constants/src`,
        //   '@luma.gl/webgl': `${__dirname}/node_modules/@luma.gl/webgl/src`,
        //   '@deck.gl/core': `${__dirname}/node_modules/@deck.gl/core/src`,
        //   '@deck.gl/layers': `${__dirname}/node_modules/@deck.gl/layers/src`,
        //   '@deck.gl/react': `${__dirname}/node_modules/@deck.gl/react/src`
      })
    }
  }
};
