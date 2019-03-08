const getWebpackConfig = require("ocular-dev-tools/config/webpack.config");

// The following files will be imported/required as array buffers via arraybuffer-loader
const BINARY_FILE_EXTENSIONS = /\.drc$|\.ply$|\.pcd$|\.glb$|\.las$|\.laz$|\.png$|\.jpeg$|\.gif$|\.bmp$|\.tiff$|\.bin|\.arrow/;

module.exports = (env = {}) => {
  const config = getWebpackConfig(env);

  config.module.rules.push(
    {
      // Load worker tests
      test: /\.worker\.js$/,
      use: {
        loader: "worker-loader"
      }
    },
    {
      test: /\.kml$/,
      use: "raw-loader"
    },
    {
      test: BINARY_FILE_EXTENSIONS,
      use: "arraybuffer-loader"
    }
  );

  return config;
};
