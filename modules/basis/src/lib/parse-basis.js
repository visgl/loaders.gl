import {loadBasisModule} from './basis-module-loader';

async function parse(data, options) {
  const module = loadBasisModule();
  return module;
}

export default parse;
