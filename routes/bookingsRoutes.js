const { Router } = require('express');
const asyncHandler = require('../lib/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { create, listMine, cancel } = require('../controllers/bookingsController');

const router = Router();

router.use(asyncHandler(requireAuth));

router.get('/mine', asyncHandler(listMine));
router.post('/', asyncHandler(create));
router.post('/:id/cancel', asyncHandler(cancel));

module.exports = router;
