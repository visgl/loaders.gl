export {default as DracoLoader} from './draco-loader';
export {default as DracoWorkerLoader} from './draco-worker-loader';
export {default as DracoWriter} from './draco-writer';

export {default as DracoParser} from './draco-parser';
export {default as DracoBuilder} from './draco-builder';

// // DEPRECATED
//
// // eslint-disable-next-line import/first
// import DracoParser from './draco-parser';
//
// function parseSync(arrayBuffer, options) {
//   const dracoParser = new DracoParser();
//   try {
//     return dracoParser.parseSync(arrayBuffer, options);
//   } finally {
//     dracoParser.destroy();
//   }
// }
//
// export const DracoWorkerLoader = {
//   name: 'DRACO',
//   extensions: ['drc'],
//   parseSync
// };
