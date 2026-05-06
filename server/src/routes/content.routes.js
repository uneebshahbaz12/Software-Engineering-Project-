const router = require('express').Router();
const auth = require('../middleware/auth');
const { getContent, getContentById, getFeatured, getKidsContent, getRecommended, getStreamUrl, incrementViewCount } = require('../controllers/content.controller');

router.use(auth);
router.get('/', getContent);
router.get('/featured', getFeatured);
router.get('/kids', getKidsContent);
router.get('/recommended', getRecommended);
router.post('/:id/view', incrementViewCount);
router.get('/:id/stream-url', getStreamUrl);
router.get('/:id', getContentById);

module.exports = router;
