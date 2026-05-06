const { success, error } = require('../utils/apiResponse');
const { syncYoutubePlaylistToDb } = require('../services/youtubePlaylistSync');

/**
 * POST /api/sync/youtube-playlist
 * Body: { playlistId, topicId?, scholarId?, onlyAssignMetaOnInsert? }
 * - playlistId: PL… id or full playlist / watch URL with list=
 * - topicId / scholarId: optional UUIDs; omit to leave inserts without link / leave updates unchanged unless provided
 * - onlyAssignMetaOnInsert: if true, existing rows only get title/description/thumbnail/duration refresh
 */
exports.syncYoutubePlaylist = async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.playlistId) return error(res, 'playlistId is required', 400);

    const opts = {
      playlistId: body.playlistId,
      onlyAssignMetaOnInsert: !!body.onlyAssignMetaOnInsert,
    };
    if (Object.prototype.hasOwnProperty.call(body, 'topicId')) opts.topicId = body.topicId;
    if (Object.prototype.hasOwnProperty.call(body, 'scholarId')) opts.scholarId = body.scholarId;

    const result = await syncYoutubePlaylistToDb(opts);
    return success(res, result, 'Playlist sync finished');
  } catch (err) {
    next(err);
  }
};
