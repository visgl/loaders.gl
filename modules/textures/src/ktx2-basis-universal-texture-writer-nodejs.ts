// Polyfills increases the bundle size significantly. Use it for NodeJS worker only
import '@loaders.gl/polyfills';

export {KTX2BasisUniversalTextureWriter as KTX2BasisUniversalTextureWriterNodeJS} from './ktx2-basis-universal-texture-writer';
