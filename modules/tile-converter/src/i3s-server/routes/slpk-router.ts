import express from 'express';
import {getFileByUrl} from '../controllers/slpk-controller';
import {createSceneServer} from '../utils/create-scene-server';

const textDecoder = new TextDecoder();

export const sceneServerRouter = express.Router();
sceneServerRouter.get('*', (req, res, next) => {
  async function routerCallback(req, res, next) {
    const file = await getFileByUrl('/');
    if (file) {
      const layer = JSON.parse(textDecoder.decode(file));
      const sceneServerResponse = createSceneServer(layer.name, layer);
      res.send(sceneServerResponse);
    } else {
      res.status(404);
      res.send('File not found');
    }
  }
  routerCallback(req, res, next);
});

export const router = express.Router();
router.get('*', (req, res, next) => {
  async function routerCallback(req, res, next) {
    const file = await getFileByUrl(req.path.replace(/\/+$/, ''));
    if (file) {
      res.send(Buffer.from(file));
    } else {
      res.status(404);
      res.send('File not found');
    }
  }
  routerCallback(req, res, next);
});
