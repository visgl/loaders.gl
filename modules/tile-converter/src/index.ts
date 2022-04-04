// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export {default as I3SConverter} from './i3s-converter/i3s-converter';
export {default as NodePages} from './i3s-converter/helpers/node-pages';

export {default as Tiles3DConverter} from './3d-tiles-converter/3d-tiles-converter';

export {DepsInstaller} from './deps-installer/deps-installer';

export const I3SAttributesWorker = {
  id: 'i3s-attribute-transformation-nodejs',
  name: 'I3S Attributes Transformation from B3DM',
  module: 'tile-converter',
  version: VERSION,
  worker: true,
  options: {
    useCartesianPostions: false
  }
};
