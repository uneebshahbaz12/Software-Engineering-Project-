const axios = require('axios');
const { success, error } = require('../utils/apiResponse');

// Cache for external API responses
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

exports.getPrayerTimes = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) return error(res, 'latitude and longitude required', 400);

    const date = new Date();
    const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const cacheKey = `prayer_${latitude}_${longitude}_${dateStr}`;

    const cached = getCached(cacheKey);
    if (cached) return success(res, cached);

    const response = await axios.get(
      `https://api.aladhan.com/v1/timings/${dateStr}`,
      { params: { latitude, longitude, method: 2 } }
    );

    const timings = response.data.data.timings;
    const result = {
      fajr: timings.Fajr,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
    };

    setCache(cacheKey, result);
    return success(res, result);
  } catch (err) { next(err); }
};

exports.getDailyAyah = async (req, res, next) => {
  try {
    const today = new Date().toDateString();
    const cacheKey = `ayah_${today}`;

    const cached = getCached(cacheKey);
    if (cached) return success(res, cached);

    // Use day of year to get a consistent ayah per day
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const ayahNumber = (dayOfYear % 6236) + 1; // Quran has 6236 ayahs

    const [arabicRes, translationRes] = await Promise.all([
      axios.get(`https://api.alquran.cloud/v1/ayah/${ayahNumber}`),
      axios.get(`https://api.alquran.cloud/v1/ayah/${ayahNumber}/en.asad`),
    ]);

    const result = {
      arabic: arabicRes.data.data.text,
      translation: translationRes.data.data.text,
      surahName: arabicRes.data.data.surah.englishName,
      surahNumber: arabicRes.data.data.surah.number,
      ayahNumber: arabicRes.data.data.numberInSurah,
      reference: `${arabicRes.data.data.surah.englishName} ${arabicRes.data.data.surah.number}:${arabicRes.data.data.numberInSurah}`,
    };

    setCache(cacheKey, result);
    return success(res, result);
  } catch (err) { next(err); }
};

exports.getRandomHadith = async (req, res, next) => {
  try {
    const cacheKey = `hadith_${new Date().getHours()}`;
    const cached = getCached(cacheKey);
    if (cached) return success(res, cached);

    const hadithNumber = Math.floor(Math.random() * 300) + 1;
    const response = await axios.get(
      `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/${hadithNumber}.json`
    );

    const result = {
      text: response.data.hadiths?.[0]?.text || response.data.text || 'Hadith not available',
      reference: `Sahih Bukhari ${hadithNumber}`,
      collection: 'Bukhari',
    };

    setCache(cacheKey, result);
    return success(res, result);
  } catch (err) { next(err); }
};

exports.getQuranSurahs = async (req, res, next) => {
  try {
    const cacheKey = 'quran_surahs_v1';
    const cached = getCached(cacheKey);
    if (cached) return success(res, cached);

    const response = await axios.get('https://api.alquran.cloud/v1/surah');
    const list = (response.data?.data || []).map((s) => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      englishNameTranslation: s.englishNameTranslation,
      numberOfAyahs: s.numberOfAyahs,
      revelationType: s.revelationType,
    }));

    setCache(cacheKey, list);
    return success(res, list);
  } catch (err) { next(err); }
};

exports.getQuranSurah = async (req, res, next) => {
  try {
    const surahNumber = Number(req.params.number);
    if (!surahNumber || surahNumber < 1 || surahNumber > 114) return error(res, 'Invalid surah number', 400);

    const cacheKey = `quran_surah_${surahNumber}`;
    const cached = getCached(cacheKey);
    if (cached) return success(res, cached);

    const [arabicRes, translationRes] = await Promise.all([
      axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}`),
      axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.asad`),
    ]);

    const arabic = arabicRes.data?.data;
    const translation = translationRes.data?.data;

    const result = {
      number: arabic?.number,
      name: arabic?.name,
      englishName: arabic?.englishName,
      englishNameTranslation: arabic?.englishNameTranslation,
      revelationType: arabic?.revelationType,
      numberOfAyahs: arabic?.numberOfAyahs,
      ayahs: (arabic?.ayahs || []).map((a, idx) => ({
        numberInSurah: a.numberInSurah,
        arabic: a.text,
        translation: translation?.ayahs?.[idx]?.text || '',
      })),
    };

    setCache(cacheKey, result);
    return success(res, result);
  } catch (err) { next(err); }
};
