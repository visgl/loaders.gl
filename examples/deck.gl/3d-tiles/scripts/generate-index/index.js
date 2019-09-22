require('@babel/register');
require('babel-polyfill');

const args = require('./args');
const main = require('./main');

main(args());
