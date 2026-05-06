const supabase = require('../config/db');
const { success, error } = require('../utils/apiResponse');

exports.getWatchlist = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    if (!profileId) return error(res, 'Profile ID required', 400);

    const { data } = await supabase
      .from('watchlist')
      .select('*, content:content_id(*, scholars:scholar_id(name, image))')
      .eq('profile_id', profileId)
      .order('added_at', { ascending: false });

    return success(res, data);
  } catch (err) { next(err); }
};

exports.addToWatchlist = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    if (!profileId) return error(res, 'Profile ID required', 400);
    const { contentId } = req.body;
    if (!contentId) return error(res, 'contentId is required', 400);

    const { data, error: dbErr } = await supabase
      .from('watchlist')
      .upsert({ profile_id: profileId, content_id: contentId, added_at: new Date().toISOString() }, { onConflict: 'profile_id,content_id' })
      .select()
      .single();

    if (dbErr) return error(res, dbErr.message, 400);
    return success(res, data, 'Added to watchlist', 201);
  } catch (err) { next(err); }
};

exports.removeFromWatchlist = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    if (!profileId) return error(res, 'Profile ID required', 400);
    await supabase.from('watchlist').delete().eq('profile_id', profileId).eq('content_id', req.params.contentId);
    return success(res, null, 'Removed from watchlist');
  } catch (err) { next(err); }
};
