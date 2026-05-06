const router = require('express').Router();
const { getPrayerTimes, getDailyAyah, getRandomHadith, getQuranSurahs, getQuranSurah } = require('../controllers/external.controller');

router.get('/prayer-times', getPrayerTimes);
router.get('/daily-ayah', getDailyAyah);
router.get('/hadith/random', getRandomHadith);
router.get('/quran/surahs', getQuranSurahs);
router.get('/quran/surah/:number', getQuranSurah);

module.exports = router;
