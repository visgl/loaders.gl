export default function (context, options) {
  return {
    name: 'webpack-docusaurus-plugin',
    configureWebpack(config, isServer, utils) {
      return {
        resolve: {
          fallback: {
            fs: false
          }
        }
      };
    }
  };
};
