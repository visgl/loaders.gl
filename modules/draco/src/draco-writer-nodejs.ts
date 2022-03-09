// Polyfills increases the bundle size significantly. Use it for NodeJS worker only
import '@loaders.gl/polyfills';

export {DracoWriter as DracoWriterNodeJS} from './draco-writer';
