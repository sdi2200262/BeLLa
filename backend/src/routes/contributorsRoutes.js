const express = require('express');
const router = express.Router();
const { getUniqueContributors } = require('../controllers/contributorsController');

router.get('/', getUniqueContributors);

module.exports = router; 