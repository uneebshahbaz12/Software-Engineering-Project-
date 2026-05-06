const router = require('express').Router();
const auth = require('../middleware/auth');
const { getBooks, getAudiobooks, getBookById, getAudiobookById } = require('../controllers/book.controller');

router.use(auth);
router.get('/audiobooks', getAudiobooks);
router.get('/audiobooks/:id', getAudiobookById);
router.get('/', getBooks);
router.get('/:id', getBookById);

module.exports = router;
