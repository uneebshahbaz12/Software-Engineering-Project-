import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure with `EXPO_PUBLIC_API_URL`, e.g. http://<your-ip>:5000/api
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const REQUEST_TIMEOUT = 20000; // 20 seconds

export const API_BASE_URL = API_URL;
export const SOCKET_BASE_URL = (process.env.EXPO_PUBLIC_SOCKET_URL || API_URL).replace(/\/api\/?$/, '');

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  const profileId = await AsyncStorage.getItem('activeProfileId');
  const headers = { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (profileId) headers['x-profile-id'] = profileId;
  return headers;
};

const request = async (endpoint, options = {}, retries = 1) => {
  try {
    const headers = await getHeaders();
    const config = { 
      headers, 
      ...options,
      timeout: REQUEST_TIMEOUT 
    };
    
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...config,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const data = await res.json();

    if (!res.ok) {
      const errorMessage = data?.message || data?.error || `HTTP ${res.status}`;
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (err) {
    // Retry logic for network errors
    if (retries > 0 && (err.name === 'AbortError' || err.message.includes('Network'))) {
      console.warn(`Request failed, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      return request(endpoint, options, retries - 1);
    }
    
    console.error('API Error:', err.message);
    throw err;
  }
};

// Auth
export const authAPI = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  forgotPassword: (body) => request('/auth/forgot-password', { method: 'POST', body }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body }),
  validateResetToken: (token) => request(`/auth/reset-password/validate-token?token=${encodeURIComponent(token)}`),
  getMe: () => request('/auth/me'),
};

// Profiles
export const profileAPI = {
  getAll: () => request('/profiles'),
  create: (body) => request('/profiles', { method: 'POST', body }),
  update: (id, body) => request(`/profiles/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/profiles/${id}`, { method: 'DELETE' }),
  verifyPin: (id, pin) => request(`/profiles/${id}/verify-pin`, { method: 'POST', body: { pin } }),
};

// Content
export const contentAPI = {
  getAll: (params = '') => request(`/content?${params}`),
  getById: (id) => request(`/content/${id}`),
  getFeatured: () => request('/content/featured'),
  getKids: () => request('/content/kids'),
  getRecommended: () => request('/content/recommended'),
  getStreamUrl: (id) => request(`/content/${id}/stream-url`),
  incrementView: (id) => request(`/content/${id}/view`, { method: 'POST' }),
};

// Scholars
export const scholarAPI = {
  getAll: () => request('/scholars'),
  getById: (id) => request(`/scholars/${id}`),
};

// Topics
export const topicAPI = {
  getAll: () => request('/topics'),
  getById: (id) => request(`/topics/${id}`),
};

// Books
export const bookAPI = {
  getAll: () => request('/books'),
  getById: (id) => request(`/books/${id}`),
  getAudiobooks: () => request('/books/audiobooks'),
  getAudiobookById: (id) => request(`/books/audiobooks/${id}`),
};

// Watchlist
export const watchlistAPI = {
  getAll: () => request('/watchlist'),
  add: (contentId) => request('/watchlist', { method: 'POST', body: { contentId } }),
  remove: (contentId) => request(`/watchlist/${contentId}`, { method: 'DELETE' }),
};

// History
export const historyAPI = {
  getAll: () => request('/history'),
  getContinueWatching: () => request('/history/continue-watching'),
  updateProgress: (body) => request('/history', { method: 'POST', body }),
  clear: () => request('/history', { method: 'DELETE' }),
  remove: (contentId) => request(`/history/${contentId}`, { method: 'DELETE' }),
};

// Gatherings
export const gatheringAPI = {
  getAll: () => request('/gatherings'),
  create: (body) => request('/gatherings', { method: 'POST', body }),
  join: (inviteCode) => request(`/gatherings/${inviteCode}/join`, { method: 'POST' }),
  leave: (inviteCode) => request(`/gatherings/${inviteCode}/leave`, { method: 'POST' }),
  end: (id) => request(`/gatherings/${id}`, { method: 'DELETE' }),
};

// Onboarding
export const onboardingAPI = {
  save: (profileId, body) => request(`/onboarding/${profileId}`, { method: 'POST', body }),
  get: (profileId) => request(`/onboarding/${profileId}`),
};

// External
export const externalAPI = {
  getPrayerTimes: (lat, lng) => request(`/external/prayer-times?latitude=${lat}&longitude=${lng}`),
  getDailyAyah: () => request('/external/daily-ayah'),
  getRandomHadith: () => request('/external/hadith/random'),
  getQuranSurahs: () => request('/external/quran/surahs'),
  getQuranSurah: (number) => request(`/external/quran/surah/${number}`),
};

// Mood-based recommendations
export const moodAPI = {
  getByMood: (mood) => request(`/content?mood=${mood}`),
};

// Search & Filter
export const searchAPI = {
  search: (query) => request(`/content?search=${encodeURIComponent(query)}`),
  getNewContent: () => request('/content?isNew=true'),
  getTrendingContent: () => request('/content?isTrending=true'),
};

// Utility function to save token
export const setAuthToken = async (token) => {
  if (token) {
    await AsyncStorage.setItem('token', token);
  } else {
    await AsyncStorage.removeItem('token');
  }
};

// Utility to save active profile
export const setActiveProfile = async (profileId) => {
  if (profileId) {
    await AsyncStorage.setItem('activeProfileId', profileId);
  } else {
    await AsyncStorage.removeItem('activeProfileId');
  }
};

// Utility to check if authenticated
export const isAuthenticated = async () => {
  const token = await AsyncStorage.getItem('token');
  return !!token;
};
