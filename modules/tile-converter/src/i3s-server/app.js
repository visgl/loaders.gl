const express = require('express');
const path = require('path');
const logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index');

const I3S_LAYER_PATH = process.env.I3sLayerPath || ''; // eslint-disable-line no-process-env, no-undef
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

if (/\.slpk$/.test(I3S_LAYER_PATH)) {
  const {sceneServerRouter, router} = require('./routes/slpk-router');
  app.use('/SceneServer/layers/0', router);
  app.use('/SceneServer', sceneServerRouter);
} else {
  app.use('/', indexRouter);
}

module.exports = app;
