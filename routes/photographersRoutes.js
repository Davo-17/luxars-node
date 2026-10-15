const { Router } = require('express');
const asyncHandler = require('../lib/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { list, detail, create } = require('../controllers/photographersController');

const router = Router();

router.post('/', asyncHandler(requireAuth), asyncHandler(create));
router.get('/', asyncHandler(list));
router.get('/:id', asyncHandler(detail));

module.exports = router;
