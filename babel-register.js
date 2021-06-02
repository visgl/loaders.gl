require('@babel/register')({
  root: __dirname, // This tells babel where to look for `babel.config.js` file
  ignore: [/node_modules/],
  only: [__dirname],
  extensions: ['.ts', '.js', '.tsx']
});
// require('@babel/polyfill');
