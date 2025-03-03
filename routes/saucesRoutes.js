const express = require('express');
const sauceCtrl = require('../controllers/sauceCtrl');

const auth = require('../middleware/auth')
const multer = require('../middleware/multer')

const router = express.Router();

router.get('/', auth, sauceCtrl.getAllSauces)
router.get('/:id', auth, sauceCtrl.getOneSauce)
router.post('/', auth, multer, sauceCtrl.createSauce)
router.put('/:id', auth, multer, sauceCtrl.modifySauce)
router.delete('/:id', auth, sauceCtrl.deleteSauce)
router.post('/:id/like', auth, sauceCtrl.sendLikeStatus)

module.exports = router;