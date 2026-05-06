const router = require('express').Router();
const auth = require('../middleware/auth');
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlist.controller');

router.use(auth);
router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.delete('/:contentId', removeFromWatchlist);

module.exports = router;
