import {loadBasisModule} from './basis-module-loader';

async function parse(data, options) {
  const {BasisFile} = await loadBasisModule(options);
  return new BasisFile(new Uint8Array(data));
}

export default parse;
