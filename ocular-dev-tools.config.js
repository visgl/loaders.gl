const { resolve } = require("path");

module.exports = {
  lint: {
    paths: ["modules/**/src", "test"],
    extensions: ["js"]
  },

  aliases: {
    test: resolve(__dirname, "./test")
  },

  entry: {
    test: "test/modules.js",
    "test-browser": "test/browser.js",
    bench: "test/bench/index.js",
    "bench-browser": "test/bench/browser.js",
    size: "test/size/import-nothing.js"
  }
};
