const getBabelConfig = require("ocular-dev-tools/config/babel.config");

module.exports = api => {
  return getBabelConfig(api, {
    plugins: [
      [
        "babel-plugin-inline-import",
        {
          extensions: [".worker.js"]
        }
      ]
    ]
  });
};
