const express = require('express');
const router = express.Router();
const {getFileNameByUrl} = require('../controllers/index-controller');

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

module.exports = router;
