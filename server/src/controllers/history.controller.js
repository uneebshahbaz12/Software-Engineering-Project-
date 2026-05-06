const supabase = require('../config/db');
const { success, error } = require('../utils/apiResponse');

exports.getHistory = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    if (!profileId) return error(res, 'Profile ID required', 400);

    const { data } = await supabase
      .from('watch_history')
      .select('*, content:content_id(*, scholars:scholar_id(name, image))')
      .eq('profile_id', profileId)
      .order('last_watched_at', { ascending: false });

    return success(res, data);
  } catch (err) { next(err); }
};

exports.getContinueWatching = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    if (!profileId) return error(res, 'Profile ID required', 400);

    const { data } = await supabase
      .from('watch_history')
      .select('*, content:content_id(*, scholars:scholar_id(name, image))')
      .eq('profile_id', profileId)
      .gt('progress_percent', 0)
      .lt('progress_percent', 100)
      .order('last_watched_at', { ascending: false })
      .limit(10);

    return success(res, data);
  } catch (err) { next(err); }
};

exports.updateProgress = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    if (!profileId) return error(res, 'Profile ID required', 400);
    const { contentId, progressSeconds, progressPercent } = req.body;
    if (!contentId) return error(res, 'contentId is required', 400);

    const { data, error: dbErr } = await supabase
      .from('watch_history')
      .upsert({
        profile_id: profileId,
        content_id: contentId,
        progress_seconds: progressSeconds,
        progress_percent: progressPercent,
        last_watched_at: new Date().toISOString(),
        completed_at: progressPercent >= 100 ? new Date().toISOString() : null,
      }, { onConflict: 'profile_id,content_id' })
      .select()
      .single();

    if (dbErr) return error(res, dbErr.message, 400);
    return success(res, data, 'Progress saved');
  } catch (err) { next(err); }
};

exports.clearHistory = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    if (!profileId) return error(res, 'Profile ID required', 400);
    await supabase.from('watch_history').delete().eq('profile_id', profileId);
    return success(res, null, 'History cleared');
  } catch (err) { next(err); }
};

exports.removeHistoryItem = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    if (!profileId) return error(res, 'Profile ID required', 400);
    const { contentId } = req.params;
    if (!contentId) return error(res, 'contentId is required', 400);

    await supabase
      .from('watch_history')
      .delete()
      .eq('profile_id', profileId)
      .eq('content_id', contentId);

    return success(res, null, 'History item removed');
  } catch (err) { next(err); }
};
