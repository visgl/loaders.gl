/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
 const tutorialSidebar = require('../../docs/docs-sidebar.json');

 // Add ArrowJS sidebar
const arrowSidebar = require('../../docs/arrowjs/arrow-sidebar.json');
tutorialSidebar.push(arrowSidebar);

 const sidebars = {
  tutorialSidebar
};

module.exports = sidebars;
