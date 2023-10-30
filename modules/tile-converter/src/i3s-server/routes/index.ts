import express from 'express';
import {getFileNameByUrl} from '../controllers/index-controller';

export const router = express.Router();

/* GET home page. */
router.get('*', async function (req, res, next) {
  const fileName = await getFileNameByUrl(req.path);
  if (fileName) {
    res.sendFile(fileName);
  } else {
    res.status(404);
    res.send('File not found');
  }
});
