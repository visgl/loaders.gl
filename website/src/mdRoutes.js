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
            name: 'About Loaders',
            markdown: require('../../docs/developer-guide/about-loaders.md')
          },
          {
            name: 'Standardized Formats',
            markdown: require('../../docs/developer-guide/standard-formats.md')
          },
          {
            name: 'glbdump',
            markdown: require('../../docs/developer-guide/glbdump.md')
          }
        ]
      },
      {
        name: 'API Reference',
        children: [
          {
            name: 'loadFile',
            markdown: require('../../docs/api-reference/load-file.md')
          }
        ]
      },
      {
        name: 'Loaders',
        children: [
          {
            name: 'DRACOLoader (glTF)',
            markdown: require('../../docs/api-reference/loaders/draco-loader.md')
          },
          {
            name: 'DRACOEncoder (glTF)',
            markdown: require('../../docs/api-reference/loaders/draco-encoder.md')
          },
          {
            name: 'GLTFLoader (glTF)',
            markdown: require('../../docs/api-reference/loaders/gltf-loader.md')
          },
          {
            name: 'GLBLoader (glTF)',
            markdown: require('../../docs/api-reference/loaders/glb-loader.md')
          },
          {
            name: 'GLBWriter (glTF)',
            markdown: require('../../docs/api-reference/loaders/glb-writer.md')
          },
          {
            name: 'GLBBuilder (glTF)',
            markdown: require('../../docs/api-reference/loaders/glb-writer.md')
          },
          {
            name: 'KMLLoader (Geospatial)',
            markdown: require('../../docs/api-reference/loaders/kml-loader.md')
          },
          {
            name: 'LASLoader (PointCloud)',
            markdown: require('../../docs/api-reference/loaders/las-loader.md')
          },
          {
            name: 'OBJLoader (Mesh)',
            markdown: require('../../docs/api-reference/loaders/obj-loader.md')
          },
          {
            name: 'PCDLoader (PointCloud)',
            markdown: require('../../docs/api-reference/loaders/pcd-loader.md')
          },
          {
            name: 'PLYLoader (Mesh/PointCloud)',
            markdown: require('../../docs/api-reference/loaders/ply-loader.md')
          }
        ]
      }
    ]
  }
];
