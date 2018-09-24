window.website = true;

// const RAW_GITHUB = 'https://raw.githubusermarkdown.crequire(o../../docs/m/uber/loaders.gl/master';)

export default [
  {
    name: 'Documentation',
    path: '/docs',
    data: [
      {
        name: 'Overview',
        children: [
          {
            name: 'Introduction',
            markdown: require('../../docs/README.md')
          },
          {
            name: 'What\'s New',
            markdown: require('../../docs/whats-new.md')
          },
          {
            name: 'Upgrade Guide',
            markdown: require('../../docs/upgrade-guide.md')
          }
        ]
      },
      {
        name: 'Getting Started',
        children: [
          {
            name: 'Overview',
            markdown: require('../../docs/get-started/README.md')
          }
        ]
      },
      {
        name: 'Developer Guide',
        children: [
          {
            name: 'Debugging',
            markdown: require('../../docs/developer-guide/about-loaders.md')
          }
        ]
      },
      {
        name: 'API Reference',
        children: [
          {
            name: 'loadFile',
            markdown: require('../../docs/api-reference/load-file.md')
          },
          {
            name: 'GLBLoader',
            markdown: require('../../docs/api-reference/loaders/glb-loader.md')
          },
          {
            name: 'GLBWrite',
            markdown: require('../../docs/api-reference/loaders/glb-writer.md')
          },
          {
            name: 'KMLLoader',
            markdown: require('../../docs/api-reference/loaders/kml-loader.md')
          },
          {
            name: 'LASLoader',
            markdown: require('../../docs/api-reference/loaders/las-loader.md')
          },
          {
            name: 'PCDLoader',
            markdown: require('../../docs/api-reference/loaders/glb-loader.md')
          },
          {
            name: 'PLYLoader',
            markdown: require('../../docs/api-reference/loaders/glb-loader.md')
          }
        ]
      }
    ]
  }
];
