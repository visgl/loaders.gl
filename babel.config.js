const TARGETS = {
  chrome: '60',
  edge: '15',
  firefox: '53',
  ios: '10.3',
  safari: '10.1',
  node: '8'
};

const CONFIG = {
  default: {
    presets: [
      // Rewritten by each target
    ],
    plugins: [
    ],
    ignore: [
      '**/*.worker.js'
    ]
  }
};

const PLUGINS = [
  ['babel-plugin-inline-import', {
    extensions: [
      '.worker.js'
    ]
  }]
];

CONFIG.es6 = Object.assign({}, CONFIG.default, {
  presets: [
    ['@babel/env', {
      targets: TARGETS,
      modules: false
    }]
  ],
  plugins: PLUGINS.concat([
    ['@babel/plugin-transform-runtime', {useESModules: true}]
  ])
});

CONFIG.esm = Object.assign({}, CONFIG.default, {
  presets: [
    ['@babel/env', {
      modules: false
    }]
  ],
  plugins: PLUGINS.concat([
    ['@babel/plugin-transform-runtime', {useESModules: true}]
  ])
});

CONFIG.es5 = Object.assign({}, CONFIG.default, {
  presets: [
    ['@babel/env', {
      forceAllTransforms: true,
      modules: 'commonjs'
    }]
  ],
  plugins: PLUGINS.concat([
    ['@babel/plugin-transform-runtime', {useESModules: false}]
  ])
});

CONFIG.cover = Object.assign({}, CONFIG.default);
// constant inlining seems to cause problems for nyc
CONFIG.cover.plugins = ['istanbul'];

module.exports = function getConfig(api) {

  // eslint-disable-next-line
  var env = api.cache(() => process.env.BABEL_ENV || process.env.NODE_ENV);

  const config = CONFIG[env] || CONFIG.default;
  // Uncomment to debug
  // eslint-disable-next-line
  // console.error(env, JSON.stringify(config, null, 2));
  // throw new Error(JSON.stringify(config, null, 2));
  return config;
};

module.exports.config = CONFIG.es6;
