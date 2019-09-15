const {getGatsbyConfig} = require('ocular-gatsby/api');

const config = require('./ocular-config');

const gatsbyConfig = getGatsbyConfig(config);

gatsbyConfig.plugins.push({resolve: 'gatsby-plugin-no-sourcemaps'});

// Ensure gatsby-source-filesystem doesn't pick up too many files in modules directory
// https://www.gatsbyjs.org/packages/gatsby-source-filesystem/#options
gatsbyConfig.plugins.forEach(plugin => {
  if (plugin && typeof plugin === 'object' && plugin.resolve === 'gatsby-source-filesystem') {
    plugin.options = plugin.options || {};
    plugin.options.ignore = plugin.options.ignore || [];
    plugin.options.ignore.push('**/modules/**/test');
    plugin.options.ignore.push('**/modules/**/src');
    plugin.options.ignore.push('**/modules/**/dist');
    plugin.options.ignore.push('**/modules/**/wip');
    plugin.options.ignore.push('**/modules/**/*.json');
  }
});

// NOTE: uncomment to debug config
// console.log(JSON.stringify(gatsbyConfig, null, 2));

module.exports = gatsbyConfig;
