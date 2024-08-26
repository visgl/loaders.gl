import express from 'express';
import path from 'path';
import logger from 'morgan';
import cors from 'cors';
// For local debug
// import {fileURLToPath} from 'url';
import {loadArchive} from './controllers/slpk-controller';
import {sceneServerRouter, router} from './routes/slpk-router';

// For local debug
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const I3S_LAYER_PATH = process.env.I3sLayerPath || ''; // eslint-disable-line no-process-env, no-undef
const FULL_LAYER_PATH = path.join(process.cwd(), I3S_LAYER_PATH); // eslint-disable-line no-undef

export let app: ReturnType<typeof express> | undefined;

if (/\.slpk$/.test(I3S_LAYER_PATH)) {
  app = express();
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({extended: false}));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(cors());
  let filePath = FULL_LAYER_PATH;
  // Checks if the first character is not a point to indicate absolute path
  const absolutePath = /^[^.]/.exec(I3S_LAYER_PATH);
  if (absolutePath) {
    filePath = I3S_LAYER_PATH;
  }
  loadArchive(filePath);
  app.use('/SceneServer/layers/0', router);
  app.use('/SceneServer', sceneServerRouter);
}
