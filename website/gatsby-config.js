const {resolve} = require('path');

const ROOT_DIR = resolve('..');

module.exports = {
  // https://stackoverflow.com/questions/46865880/react-16-warning-expected-server-html-to-contain-a-matching-div-in-div-due
  flags: {
    DEV_SSR: false,
  },
  plugins: [
    {
      resolve: `gatsby-theme-ocular`,
      options: {
        logLevel: 1, // Adjusts amount of debug information from ocular-gatsby

        // Folders
        DIR_NAME: __dirname,
        ROOT_FOLDER: ROOT_DIR,

        DOCS: require('../docs/table-of-contents.json'),
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

        // This is only activated in staging, with `gatsby build --prefix-paths`
        PATH_PREFIX: '/loaders.gl',

        GA_TRACKING_ID: 'UA-74374017-2',

        // For showing star counts and contributors.
        // Should be like btoa('YourUsername:YourKey') and should be readonly.
        GITHUB_KEY: null,

        HOME_PATH: '',

        LINK_TO_GET_STARTED: '/docs/developer-guide/get-started',

        PROJECTS: [
          {name: 'vis.gl', url: 'https://vis.gl'},
          {name: 'deck.gl', url: 'https://deck.gl'},
          {name: 'luma.gl', url: 'https://luma.gl'},
          {name: 'nebula.gl', url: 'https://nebula.gl/'}
        ],

        ADDITIONAL_LINKS: [
          {name: 'Blog', href: 'http://medium.com/vis-gl', index: 4}
        ],

        THEME_OVERRIDES: {
          "primary400": "#00ADE6",
          "mono100": "#FFFFFF",
          "mono200": "#fafafa",
          "mono300": "#f2f2f2",
          "mono400": "#e9e9e9",
          "mono500": "#d5d5d5",
          "mono600": "#afafaf",
          "mono700": "#838383",
          "mono800": "#585858",
          "mono900": "#3a3a3a",
          "mono1000": "#232323"
        },
        
        STYLESHEETS: ['/style.css'],
        PAGES: [
          {
            path: '/',
            componentUrl: resolve(__dirname, './templates/index.jsx'),
            content: ''
          }
        ],

        EXAMPLES: [
          {
            title: 'glTF Loader',
            category: "Loaders",
            image: 'images/example-gltf.jpg',
            componentUrl: resolve(__dirname, './templates/example-gltf.jsx'),
            path: 'examples/gltf'
          },
          {
            title: 'Texture Loaders',
            category: "Loaders",
            image: 'images/example-textures.png',
            componentUrl: resolve(__dirname, '../examples/website/textures/app.js'),
            path: 'examples/textures'
          },
          {
            title: 'Point Cloud Loaders',
            category: "Loaders",
            image: 'images/example-pointcloud.jpg',
            componentUrl: resolve(__dirname, '../examples/website/pointcloud/app.js'),
            path: 'examples/pointcloud'
          },
          {
            title: '3D Tiles Loader',
            category: "Loaders",
            image: 'images/example-3d-tiles.png',
            componentUrl: resolve(__dirname, '../examples/website/3d-tiles/app.js'),
            path: 'examples/3d-tiles'
          },
          {
            title: 'I3S Loader',
            category: "Loaders",
            image: 'images/example-i3s.jpg',
            componentUrl: resolve(__dirname, '../examples/experimental/i3s-17-and-debug/app.js'),
            path: 'examples/i3s'
          },
          {
            title: 'I3S Debug',
            category: "Loaders",
            image: 'images/example-i3s.jpg',
            componentUrl: resolve(__dirname, '../examples/experimental/i3s-17-and-debug/app-debug.js'),
            path: 'examples/i3s-debug'
          },
          {
            title: 'Benchmarks',
            category: "Benchmarks",
            image: 'images/benchmark.png',
            componentUrl: resolve(__dirname, '../examples/benchmarks/app-website.js'),
            path: 'examples/benchmarks'
          }
        ]
      }
    },
    {
      resolve: `gatsby-plugin-favicon`,
      options: {
        logo: './static/images/favicon.png'
      }
    },
    {resolve: 'gatsby-plugin-no-sourcemaps'}
  ]
};
