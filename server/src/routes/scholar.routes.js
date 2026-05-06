const router = require('express').Router();
const auth = require('../middleware/auth');
const { getScholars, getScholarById } = require('../controllers/scholar.controller');

router.use(auth);
router.get('/', getScholars);
router.get('/:id', getScholarById);

module.exports = router;
