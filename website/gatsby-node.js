// NOTE: It is possible to override the ocular-provided callbacks
// and this take control any aspect of gatsby:

// exports.onCreateNode = ({ node, actions, getNode }) =>
//   ocular.onCreateNode({ node, actions, getNode });

// exports.setFieldsOnGraphQLNodeType = ({ type, actions }) =>
//   ocular.setFieldsOnGraphQLNodeType({ type, actions });

// // This is a main gatsby entry point
// // Here we get to programmatically create pages after all nodes are created
// // by gatsby.
// // We use graphgl to query for nodes and iterate
// exports.createPages = ({ graphql, actions }) =>
//   ocular.createPages({ graphql, actions });

const resolve = require('path').resolve;
const ocularConfig = require('./ocular-config');
const getGatsbyNodeCallbacks = require('ocular-gatsby/gatsby-node');

const callbacks = getGatsbyNodeCallbacks(ocularConfig);

module.exports = callbacks;

const onCreateWebpackConfig = callbacks.onCreateWebpackConfig;

callbacks.onCreateWebpackConfig = function onCreateWebpackConfigOverride(opts) {
  onCreateWebpackConfig(opts);

  const {
    // stage, // build stage: ‘develop’, ‘develop-html’, ‘build-javascript’, or ‘build-html’
    // rules, // Object (map): set of preconfigured webpack config rules
    // plugins, // Object (map): A set of preconfigured webpack config plugins
    // getConfig, // Function that returns the current webpack config
    loaders, // Object (map): set of preconfigured webpack config loaders
    actions
  } = opts;

  console.log(`App rewriting gatsby webpack config`); // eslint-disable-line

  // Recreate it with custom exclude filter
  // Called without any arguments, `loaders.js` will return an
  // object like:
  // {
  //   options: undefined,
  //   loader: '/path/to/node_modules/gatsby/dist/utils/babel-loader.js',
  // }
  // Unless you're replacing Babel with a different transpiler, you probably
  // want this so that Gatsby will apply its required Babel
  // presets/plugins.  This will also merge in your configuration from
  // `babel.config.js`.
  const newJSRule = loaders.js();

  Object.assign(newJSRule, {
    // JS and JSX
    test: /\.jsx?$/,

    // Exclude all node_modules from transpilation, except for ocular
    exclude: modulePath =>
      /node_modules/.test(modulePath) &&
      !/node_modules\/(ocular|ocular-gatsby|gatsby-plugin-ocular)/.test(modulePath)
  });

  const newConfig = {
    module: {
      rules: [
        // Omit the default rule where test === '\.jsx?$'
        newJSRule
      ]
    },
    node: {
      fs: 'empty'
    },
    resolve: {
      alias: {
        '@loaders.gl/3d-tiles': '/Users/ib/Documents/loaders.gl/modules/3d-tiles/src',
        '@loaders.gl/arrow': '/Users/ib/Documents/loaders.gl/modules/arrow/src',
        '@loaders.gl/core': '/Users/ib/Documents/loaders.gl/modules/core/src',
        '@loaders.gl/csv': '/Users/ib/Documents/loaders.gl/modules/csv/src',
        '@loaders.gl/draco': '/Users/ib/Documents/loaders.gl/modules/draco/src',
        '@loaders.gl/experimental': '/Users/ib/Documents/loaders.gl/modules/experimental/src',
        '@loaders.gl/gltf': '/Users/ib/Documents/loaders.gl/modules/gltf/src',
        '@loaders.gl/images': '/Users/ib/Documents/loaders.gl/modules/images/src',
        '@loaders.gl/kml': '/Users/ib/Documents/loaders.gl/modules/kml/src',
        '@loaders.gl/las': '/Users/ib/Documents/loaders.gl/modules/las/src',
        '@loaders.gl/obj': '/Users/ib/Documents/loaders.gl/modules/obj/src',
        '@loaders.gl/pcd': '/Users/ib/Documents/loaders.gl/modules/pcd/src',
        '@loaders.gl/ply': '/Users/ib/Documents/loaders.gl/modules/ply/src',
        '@loaders.gl/polyfills': '/Users/ib/Documents/loaders.gl/modules/polyfills/src',
        '@loaders.gl/zip': '/Users/ib/Documents/loaders.gl/modules/zip/src',
      }
    }
  };

  // Merges into the webpack config
  actions.setWebpackConfig(newConfig);
};
