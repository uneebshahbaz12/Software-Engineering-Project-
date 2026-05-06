const router = require('express').Router();
const syncAuth = require('../middleware/syncAuth');
const { syncYoutubePlaylist } = require('../controllers/sync.controller');

router.post('/youtube-playlist', syncAuth, syncYoutubePlaylist);

module.exports = router;
