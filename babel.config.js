const getBabelConfig = require("ocular-dev-tools/config/babel.config");

module.exports = api => {
  const config = getBabelConfig(api, {
    plugins: [
      [
        "babel-plugin-inline-import",
        {
          extensions: [".worker.js"]
        }
      ]
    ]
  });

  config.ignore = [
    '**/*.worker.js'
  ];

  return config;
};
