const router = require('express').Router();
const auth = require('../middleware/auth');
const { getGatherings, createGathering, joinGathering, leaveGathering, endGathering } = require('../controllers/gathering.controller');

router.use(auth);
router.get('/', getGatherings);
router.post('/', createGathering);
router.post('/:inviteCode/join', joinGathering);
router.post('/:inviteCode/leave', leaveGathering);
router.delete('/:id', endGathering);

module.exports = router;
