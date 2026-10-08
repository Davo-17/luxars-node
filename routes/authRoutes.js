const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/authController');

const router = Router();

router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

module.exports = router;
