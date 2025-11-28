const express = require('express');
const router = express.Router();
const { downloadPDF } = require('../controllers/pdfController');

router.get('/:filename', downloadPDF);

module.exports = router;
