const DOCS = require('../docs/table-of-contents.json');

module.exports = {
  DOC_FOLDER: `${__dirname}/../docs/`,
  ROOT_FOLDER: `${__dirname}/../`,

  EXAMPLES: [],
  DOCS,

  // TODO/ib - from ocular, deduplicate with above settings
  PROJECT_TYPE: 'github',

  PROJECT_NAME: 'loaders.gl',
  PROJECT_ORG: 'uber-web',
  PROJECT_URL: 'https://github.com/uber-web/loaders.gl',
  PROJECT_DESC: 'Framework agnostic loaders for visualization assets',
  WEBSITE_PATH: '/website/',

  FOOTER_LOGO: '',

  PROJECTS: [],

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

  ADDITIONAL_LINKS: [],

  GA_TRACKING: null,

  // For showing star counts and contributors.
  // Should be like btoa('YourUsername:YourKey') and should be readonly.
  GITHUB_KEY: null,

  // TODO/ib - from gatsby starter, clean up
  // Site title.
  siteTitle: 'loaders.gl',
  // Alternative site title for SEO.
  siteTitleAlt: 'loaders.gl',
  // Logo used for SEO and manifest.
  siteLogo: '/logos/logo-1024.png',
  // Domain of your website without pathPrefix.
  siteUrl: 'https://ocular',
  // Prefixes all links. For cases when deployed to example.github.io/gatsby-advanced-starter/.
  pathPrefix: '/luma',
  // Website description used for RSS feeds/meta description tag.
  siteDescription: 'WebGL2 Components',
  // Path to the RSS file.
  siteRss: '/rss.xml',
  // Date format used in the frontmatter.
  dateFromFormat: 'YYYY-MM-DD',
  // Date format for display.
  dateFormat: 'DD/MM/YYYY',
  // Username to display in the author segment.
  userName: 'WebGL User',
  // Copyright string for the footer of the website and RSS feed.
  copyright: 'Copyright © 2017 Uber. MIT Licensed',
  // Used for setting manifest and progress theme colors.
  themeColor: '#c62828',
  // Used for setting manifest background color.
  backgroundColor: '#e0e0e0'
};
