import getPixels from 'get-pixels';
import {promisify} from '../../utils';

export default function parseImage(url) {
  return promisify(getPixels)(url);
}
