// Polyfills increases the bundle size significantly. Use it for NodeJS worker only
import '@loaders.gl/polyfills';

export {KTX2BasisWriter as KTX2BasisWriterNodeJS} from './ktx2-basis-writer';
