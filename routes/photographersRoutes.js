const { Router } = require('express');
const asyncHandler = require('../lib/asyncHandler');
const { list, detail } = require('../controllers/photographersController');

const router = Router();

router.get('/', asyncHandler(list));
router.get('/:id', asyncHandler(detail));

module.exports = router;
