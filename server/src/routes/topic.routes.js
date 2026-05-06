const router = require('express').Router();
const auth = require('../middleware/auth');
const { getTopics, getTopicById } = require('../controllers/topic.controller');

router.use(auth);
router.get('/', getTopics);
router.get('/:id', getTopicById);

module.exports = router;
