const axios = require('axios');
const { YOUTUBE_API_KEY } = require('../config/env');
const supabase = require('../config/db');

const YT = 'https://www.googleapis.com/youtube/v3';

/** Accept raw PL… id or full playlist URL */
function normalizePlaylistId(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s) && !s.includes('?')) return s;
  try {
    const u = new URL(s.includes('://') ? s : `https://www.youtube.com/${s}`);
    const list = u.searchParams.get('list');
    if (list) return list;
    if (u.pathname.includes('/playlist')) {
      const last = u.pathname.split('/').filter(Boolean).pop();
      if (last && last !== 'playlist') return last;
    }
  } catch {
    /* ignore */
  }
  return s;
}

/** PT1H2M3S → seconds */
function iso8601DurationToSeconds(iso) {
  if (!iso || typeof iso !== 'string') return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const sec = parseInt(m[3] || '0', 10);
  return h * 3600 + min * 60 + sec;
}

function secondsToLabel(total) {
  if (!total) return '';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function pickThumbnail(thumbnails) {
  if (!thumbnails) return '';
  const order = ['maxres', 'standard', 'high', 'medium', 'default'];
  for (const k of order) {
    if (thumbnails[k]?.url) return thumbnails[k].url;
  }
  return '';
}

async function fetchPlaylistVideoIds(apiKey, playlistId) {
  const ids = [];
  let pageToken;
  try {
    do {
      const { data } = await axios.get(`${YT}/playlistItems`, {
        params: {
          part: 'snippet,contentDetails',
          playlistId,
          maxResults: 50,
          pageToken: pageToken || undefined,
          key: apiKey,
        },
        timeout: 30000,
      });
      if (data.error) {
        const msg = data.error.message || 'YouTube API error';
        throw new Error(msg);
      }
      for (const item of data.items || []) {
        const vid = item.snippet?.resourceId?.videoId;
        if (vid && item.snippet?.resourceId?.kind === 'youtube#video') ids.push(vid);
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
  } catch (e) {
    const yte = e.response?.data?.error;
    throw new Error(yte?.message || e.message || 'playlistItems request failed');
  }
  return [...new Set(ids)];
}

async function fetchVideoDetails(apiKey, videoIds) {
  const out = new Map();
  const chunkSize = 50;
  try {
    for (let i = 0; i < videoIds.length; i += chunkSize) {
      const chunk = videoIds.slice(i, i + chunkSize);
      const { data } = await axios.get(`${YT}/videos`, {
        params: {
          part: 'snippet,contentDetails',
          id: chunk.join(','),
          key: apiKey,
        },
        timeout: 30000,
      });
      if (data.error) {
        const msg = data.error.message || 'YouTube API error';
        throw new Error(msg);
      }
      for (const v of data.items || []) {
        out.set(v.id, v);
      }
    }
  } catch (e) {
    const yte = e.response?.data?.error;
    throw new Error(yte?.message || e.message || 'videos.list request failed');
  }
  return out;
}

/**
 * Pull all videos from a public YouTube playlist and upsert into `content`.
 * Matches existing rows by `youtube_video_id`.
 *
 * @param {object} opts
 * @param {string} opts.playlistId
 * @param {string|null|undefined} [opts.topicId] — omit property to leave unchanged on update / null on insert
 * @param {string|null|undefined} [opts.scholarId]
 * @param {boolean} [opts.onlyAssignMetaOnInsert] — if true, updates only refresh title/thumb/duration (not topic/scholar)
 */
async function syncYoutubePlaylistToDb(opts) {
  const apiKey = YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set in server .env');

  const playlistId = normalizePlaylistId(opts.playlistId);
  if (!playlistId) throw new Error('Invalid or missing playlistId');

  const hasTopic = Object.prototype.hasOwnProperty.call(opts, 'topicId');
  const hasScholar = Object.prototype.hasOwnProperty.call(opts, 'scholarId');
  const topicValue = hasTopic ? opts.topicId : null;
  const scholarValue = hasScholar ? opts.scholarId : null;
  const onlyAssignMetaOnInsert = !!opts.onlyAssignMetaOnInsert;

  const videoIds = await fetchPlaylistVideoIds(apiKey, playlistId);
  if (videoIds.length === 0) {
    return { playlistId, synced: 0, inserted: 0, updated: 0, skipped: 0, errors: [] };
  }

  const details = await fetchVideoDetails(apiKey, videoIds);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  for (const vid of videoIds) {
    const v = details.get(vid);
    if (!v) {
      skipped += 1;
      errors.push({ youtube_video_id: vid, message: 'No details returned (private/deleted?)' });
      continue;
    }

    const snippet = v.snippet || {};
    const cd = v.contentDetails || {};
    const durationSec = iso8601DurationToSeconds(cd.duration);
    const title = snippet.title || 'Untitled';
    const description = snippet.description || '';
    const thumbnail = pickThumbnail(snippet.thumbnails);
    const publishedAt = snippet.publishedAt || new Date().toISOString();

    const baseRow = {
      title,
      description,
      thumbnail,
      youtube_video_id: vid,
      source_type: 'youtube',
      source_url: '',
      duration_seconds: durationSec,
      duration: secondsToLabel(durationSec),
      published_at: publishedAt,
    };

    try {
      const { data: existing, error: selErr } = await supabase
        .from('content')
        .select('id')
        .eq('youtube_video_id', vid)
        .maybeSingle();

      if (selErr) throw new Error(selErr.message);

      if (existing?.id) {
        const patch = { ...baseRow };
        if (!onlyAssignMetaOnInsert) {
          if (hasTopic) patch.topic_id = topicValue;
          if (hasScholar) patch.scholar_id = scholarValue;
        }
        const { error: upErr } = await supabase.from('content').update(patch).eq('id', existing.id);
        if (upErr) throw new Error(upErr.message);
        updated += 1;
      } else {
        const row = {
          ...baseRow,
          topic_id: hasTopic ? topicValue : null,
          scholar_id: hasScholar ? scholarValue : null,
        };
        const { error: insErr } = await supabase.from('content').insert(row);
        if (insErr) throw new Error(insErr.message);
        inserted += 1;
      }
    } catch (e) {
      errors.push({ youtube_video_id: vid, message: e.message || String(e) });
    }
  }

  return {
    playlistId,
    synced: inserted + updated,
    inserted,
    updated,
    skipped,
    errors,
  };
}

module.exports = {
  normalizePlaylistId,
  syncYoutubePlaylistToDb,
};
