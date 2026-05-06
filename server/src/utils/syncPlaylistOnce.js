/**
 * One-shot playlist sync from the shell (cron-friendly).
 *
 * Usage:
 *   cd server
 *   node src/utils/syncPlaylistOnce.js "<PLAYLIST_ID_OR_URL>" [topicUuid] [scholarUuid]
 *
 * Requires server/.env: SUPABASE_*, YOUTUBE_API_KEY
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { syncYoutubePlaylistToDb } = require('../services/youtubePlaylistSync');

async function main() {
  const playlistId = process.argv[2];
  const topicArg = process.argv[3];
  const scholarArg = process.argv[4];

  if (!playlistId) {
    console.error('Usage: node src/utils/syncPlaylistOnce.js "<PLAYLIST_ID_OR_URL>" [topicUuid] [scholarUuid]');
    process.exit(1);
  }

  const opts = { playlistId };
  if (topicArg) opts.topicId = topicArg;
  if (scholarArg) opts.scholarId = scholarArg;

  const result = await syncYoutubePlaylistToDb(opts);
  console.log(JSON.stringify(result, null, 2));
  if (result.errors?.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
