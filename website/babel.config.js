module.exports = {
  presets: [require.resolve('@docusaurus/core/lib/babel/preset')],
  overrides: [
    {
      test: /\.[cm]?tsx?$/,
      presets: [
        [
          require.resolve('@babel/preset-typescript'),
          {
            allowDeclareFields: true,
            allExtensions: true,
            isTSX: true
          }
        ]
      ]
    }
  ],
  plugins: ["styled-components"]
};
