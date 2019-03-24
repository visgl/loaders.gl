import DRACOEncoder from './draco-encoder';

function encodeDRACO(arrayBuffer, options) {
  const dracoDecoder = new DRACOEncoder();
  return dracoDecoder.encode(arrayBuffer, options);
}

export default {
  name: 'DRACO',
  extension: 'drc',
  encodeSync: encodeDRACO
};
