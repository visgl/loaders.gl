window.website = true;

// const RAW_GITHUB = 'https://raw.githubusercontent.com/uber/loaders.gl/master';

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
            content: 'api-reference/loaders/load-file.md'
          },
          {
            name: 'GLBLoader',
            content: 'api-reference/loaders/glb-loader.md'
          },
          {
            name: 'GLBWriter',
            content: 'api-reference/loaders/glb-writer.md'
          },
          {
            name: 'KMLLoader',
            content: 'api-reference/loaders/kml-loader.md'
          },
          {
            name: 'LASLoader',
            content: 'api-reference/loaders/las-loader.md'
          },
          {
            name: 'PCDLoader',
            content: 'api-reference/loaders/glb-loader.md'
          },
          {
            name: 'PLYLoader',
            content: 'api-reference/loaders/glb-loader.md'
          }
        ]
      }
    ]
  }
];
