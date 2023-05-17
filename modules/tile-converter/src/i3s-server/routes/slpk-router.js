const express = require('express');
const { getFileByUrl } = require('../controllers/slpk-controller');


/* GET home page. */
const router = express.Router();

router.get('*', async function (req, res, next) {
    const file = await getFileByUrl(req.path)
    if (file) {
        res.send(file)
    } else {
        res.status(404);
        res.send('File not found');
    }
});

module.exports = router;
