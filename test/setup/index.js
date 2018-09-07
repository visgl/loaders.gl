// decorate tape-catch with tape-promise
import test_ from 'tape-catch';
import tapePromise from 'tape-promise';
export default tapePromise(test_);

export {default as deepCopy} from './deep-copy';
