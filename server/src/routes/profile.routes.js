const router = require('express').Router();
const auth = require('../middleware/auth');
const { getProfiles, createProfile, updateProfile, deleteProfile, verifyPin } = require('../controllers/profile.controller');

router.use(auth);
router.get('/', getProfiles);
router.post('/', createProfile);
router.put('/:id', updateProfile);
router.delete('/:id', deleteProfile);
router.post('/:id/verify-pin', verifyPin);

module.exports = router;
