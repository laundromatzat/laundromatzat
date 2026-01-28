const express = require('express');
const ideasController = require('../controllers/ideasController');

const router = express.Router();

router.post('/generate', ideasController.generateIdeas);

module.exports = router;
