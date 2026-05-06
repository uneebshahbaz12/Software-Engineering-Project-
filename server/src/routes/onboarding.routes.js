const router = require('express').Router();
const auth = require('../middleware/auth');
const { savePreferences, getPreferences } = require('../controllers/onboarding.controller');

router.use(auth);
router.post('/:profileId', savePreferences);
router.put('/:profileId', savePreferences);
router.get('/:profileId', getPreferences);

module.exports = router;
