const {getGatsbyConfig} = require('ocular-gatsby/api');

const config = require('./ocular-config');

const gatsbyConfig = getGatsbyConfig(config);

gatsbyConfig.plugins.push({resolve: 'gatsby-plugin-no-sourcemaps'});

module.exports = gatsbyConfig;
