const express = require('express');
const {getFileByUrl} = require('../controllers/slpk-controller');
const createSceneServer = require('../utils/create-scene-server');

const sceneServerRouter = express.Router();
sceneServerRouter.get('*', async function (req, res, next) {
  const file = await getFileByUrl('/');
  if (file) {
    const layer = JSON.parse(file.toString());
    const sceneServerResponse = createSceneServer(layer.name, layer);
    res.send(sceneServerResponse);
  } else {
    res.status(404);
    res.send('File not found');
  }
});

const router = express.Router();
router.get('*', async function (req, res, next) {
  console.log(req.path);
  const file = await getFileByUrl(req.path);
  if (file) {
    res.send(file);
  } else {
    res.status(404);
    res.send('File not found');
  }
});

module.exports = {
  sceneServerRouter,
  router
};
