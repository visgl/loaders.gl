import express from 'express';
import path from 'path';
import logger from 'morgan';
import cors from 'cors';

const indexRouter = require('./routes/index');
const {sceneServerRouter, router} = require('./routes/slpk-router');

const I3S_LAYER_PATH = process.env.I3sLayerPath || ''; // eslint-disable-line no-process-env, no-undef
export const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

if (/\.slpk$/.test(I3S_LAYER_PATH)) {
  app.use('/SceneServer/layers/0', router);
  app.use('/SceneServer', sceneServerRouter);
} else {
  app.use('/', indexRouter);
}
