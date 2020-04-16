const DOCS = require('../docs/table-of-contents.json');

const DEPENDENCIES = require('./package.json').dependencies;

const dependencyAliases = {};
for (const dependency in DEPENDENCIES) {
  dependencyAliases[dependency] = `${__dirname}/node_modules/${dependency}`;
}

module.exports = {
  logLevel: 4,

  DIR_NAME: `${__dirname}`,
  DOC_FOLDER: `${__dirname}/../docs/`,
  ROOT_FOLDER: `${__dirname}/../../`,

  EXAMPLES: [],
  DOCS,

  // TODO/ib - from ocular, deduplicate with above settings
  PROJECT_TYPE: 'github',

  PROJECT_NAME: 'arrow/js',
  PROJECT_ORG: 'uber-web',
  PROJECT_URL: 'https://github.com/visgl/loaders.gl',
  PROJECT_DESC: 'Apache Arrow JavaScript Bindings',

  PATH_PREFIX: '/arrowjs',

  FOOTER_LOGO: '',

  PROJECTS: [],

  HOME_PATH: '/',

  HOME_HEADING: 'JavaScript API for Binary Columnar Tables',

  HOME_RIGHT: null,

  HOME_BULLETS: [],

  ADDITIONAL_LINKS: [],

  GA_TRACKING: null,

  // For showing star counts and contributors.
  // Should be like btoa('YourUsername:YourKey') and should be readonly.
  GITHUB_KEY: null,

  // Ocular adds this to gatsby's webpack config
  webpack: {
    resolve: {
      alias: dependencyAliases
    }
  }
};
