// Video saving for browser

import {global} from '../utils/globals';

// @ts-ignore TS2339: Property does not exist on type
const {_encodeVideoNode} = global;

export function encodeVideo(video, type) {
  if (_encodeVideoNode) {
    // @ts-ignore TS2339: Property does not exist on type
    return _encodeVideoNode(video, type);
  }

  throw new Error('not implemented');
}
