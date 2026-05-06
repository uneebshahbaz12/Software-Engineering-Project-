const router = require('express').Router();
const auth = require('../middleware/auth');
const { getHistory, getContinueWatching, updateProgress, clearHistory, removeHistoryItem } = require('../controllers/history.controller');

router.use(auth);
router.get('/', getHistory);
router.get('/continue-watching', getContinueWatching);
router.post('/', updateProgress);
router.delete('/', clearHistory);
router.delete('/:contentId', removeHistoryItem);

module.exports = router;
