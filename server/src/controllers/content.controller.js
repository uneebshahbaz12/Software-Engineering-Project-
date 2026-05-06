const supabase = require('../config/db');
const { success, error } = require('../utils/apiResponse');

async function getActiveProfile(req) {
  const profileId = req.headers['x-profile-id'];
  if (!profileId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, user_id, is_kids, enabled_categories')
    .eq('id', profileId)
    .eq('user_id', req.user.userId)
    .single();
  return data || null;
}

function applyKidsRestrictions(query, profile) {
  if (!profile?.is_kids) return query;

  // Always force kids content for kids profiles.
  query = query.eq('is_kids_content', true);

  // If parental controls specify enabled categories, restrict to them.
  // NOTE: `content.kids_category` should be set to a value that matches `profiles.enabled_categories` entries.
  const enabled = Array.isArray(profile.enabled_categories) ? profile.enabled_categories.filter(Boolean) : [];
  if (enabled.length > 0) {
    query = query.in('kids_category', enabled);
  }

  return query;
}

exports.getContent = async (req, res, next) => {
  try {
    const { topicId, scholarId, kidsCategory, isNew, isTrending, isKids, search, mood, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const activeProfile = await getActiveProfile(req);

    let query = supabase
      .from('content')
      .select('*, scholars:scholar_id(name, image), topics:topic_id(name, color)', { count: 'exact' });

    if (topicId) query = query.eq('topic_id', topicId);
    if (scholarId) query = query.eq('scholar_id', scholarId);
    if (kidsCategory) query = query.eq('kids_category', kidsCategory);
    if (isNew === 'true') query = query.eq('is_new', true);
    if (isTrending === 'true') query = query.eq('is_trending', true);
    if (isKids === 'true') query = query.eq('is_kids_content', true);
    if (search) {
      // Search across title and description
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (mood) query = query.contains('mood_tags', [mood]);

    query = applyKidsRestrictions(query, activeProfile);

    const { data, count, error: dbErr } = await query
      .order('published_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (dbErr) return error(res, dbErr.message, 400);

    return success(res, {
      items: data, total: count,
      page: parseInt(page), pages: Math.ceil(count / parseInt(limit)),
    });
  } catch (err) { next(err); }
};

exports.getContentById = async (req, res, next) => {
  try {
    const activeProfile = await getActiveProfile(req);

    const { data, error: dbErr } = await supabase
      .from('content')
      .select('*, scholars:scholar_id(name, image, bio), topics:topic_id(name, color, icon)')
      .eq('id', req.params.id)
      .single();

    if (dbErr || !data) return error(res, 'Content not found', 404);

    if (activeProfile?.is_kids) {
      if (!data.is_kids_content) return error(res, 'Content not found', 404);
      const enabled = Array.isArray(activeProfile.enabled_categories) ? activeProfile.enabled_categories.filter(Boolean) : [];
      if (enabled.length > 0 && !enabled.includes(data.kids_category)) return error(res, 'Content not found', 404);
    }

    return success(res, data);
  } catch (err) { next(err); }
};

exports.getFeatured = async (req, res, next) => {
  try {
    const activeProfile = await getActiveProfile(req);

    const { data } = await supabase
      .from('content')
      .select('*, scholars:scholar_id(name, image)')
      .eq('is_trending', true)
      .order('view_count', { ascending: false })
      .limit(5);

    // Apply kids enforcement client-side since this endpoint doesn't accept query chaining with count/range.
    // For kids profiles, only return kids content (and only enabled categories if set).
    if (activeProfile?.is_kids) {
      const enabled = Array.isArray(activeProfile.enabled_categories) ? activeProfile.enabled_categories.filter(Boolean) : [];
      const filtered = (data || []).filter((c) => {
        if (!c?.is_kids_content) return false;
        if (enabled.length === 0) return true;
        return enabled.includes(c.kids_category);
      });
      return success(res, filtered);
    }

    return success(res, data || []);
  } catch (err) { next(err); }
};

exports.getKidsContent = async (req, res, next) => {
  try {
    const activeProfile = await getActiveProfile(req);

    const { data } = await supabase
      .from('content')
      .select('*, scholars:scholar_id(name, image)')
      .eq('is_kids_content', true)
      .order('published_at', { ascending: false });

    if (activeProfile?.is_kids) {
      const enabled = Array.isArray(activeProfile.enabled_categories) ? activeProfile.enabled_categories.filter(Boolean) : [];
      if (enabled.length > 0) {
        return success(res, (data || []).filter((c) => enabled.includes(c.kids_category)));
      }
    }
    return success(res, data || []);
  } catch (err) { next(err); }
};

exports.getRecommended = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    if (!profileId) return error(res, 'Profile ID required', 400);

    const activeProfile = await getActiveProfile(req);

    // Recent watch history (signals: topic/scholar)
    const { data: historyRows } = await supabase
      .from('watch_history')
      .select('content:content_id(topic_id, scholar_id)')
      .eq('profile_id', profileId)
      .order('last_watched_at', { ascending: false })
      .limit(30);

    const topicFreq = {};
    const scholarFreq = {};
    for (const row of historyRows || []) {
      const t = row?.content?.topic_id;
      const s = row?.content?.scholar_id;
      if (t) topicFreq[t] = (topicFreq[t] || 0) + 1;
      if (s) scholarFreq[s] = (scholarFreq[s] || 0) + 1;
    }

    // Onboarding interests/challenges (signals: tags + title search)
    const { data: prefs } = await supabase
      .from('onboarding_preferences')
      .select('interests, challenges')
      .eq('profile_id', profileId)
      .maybeSingle();

    const preferenceTerms = [
      ...(prefs?.interests || []),
      ...(prefs?.challenges || []),
    ]
      .map((x) => String(x || '').trim())
      .filter(Boolean);

    // Pull a candidate pool and score in-memory.
    let query = supabase
      .from('content')
      .select('*, scholars:scholar_id(name, image), topics:topic_id(name, color)')
      .order('published_at', { ascending: false })
      .limit(120);

    query = applyKidsRestrictions(query, activeProfile);
    const { data: candidates, error: dbErr } = await query;
    if (dbErr) return error(res, dbErr.message, 400);

    const scored = (candidates || []).map((c) => {
      let score = 0;
      score += (topicFreq[c.topic_id] || 0) * 4;
      score += (scholarFreq[c.scholar_id] || 0) * 3;
      if (c.is_trending) score += 2;
      if (c.is_new) score += 1;
      score += Math.min(3, Number(c.rating || 0) / 2);

      const hay = `${c.title || ''} ${c.description || ''}`.toLowerCase();
      const tags = Array.isArray(c.mood_tags) ? c.mood_tags.map((t) => String(t).toLowerCase()) : [];
      for (const term of preferenceTerms) {
        const q = term.toLowerCase();
        if (hay.includes(q)) score += 1.5;
        if (tags.includes(q)) score += 2;
      }
      return { ...c, _score: score };
    });

    const items = scored
      .sort((a, b) => b._score - a._score || Number(b.view_count || 0) - Number(a.view_count || 0))
      .slice(0, 20)
      .map(({ _score, ...rest }) => rest);

    return success(res, items);
  } catch (err) { next(err); }
};

// Get streaming URL for video player
exports.getStreamUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const activeProfile = await getActiveProfile(req);

    const { data, error: dbErr } = await supabase
      .from('content')
      .select('source_url, youtube_video_id, title, source_type, is_kids_content, kids_category')
      .eq('id', id)
      .single();

    if (dbErr || !data) return error(res, 'Content not found', 404);

    if (activeProfile?.is_kids) {
      if (!data.is_kids_content) return error(res, 'Content not found', 404);
      const enabled = Array.isArray(activeProfile.enabled_categories) ? activeProfile.enabled_categories.filter(Boolean) : [];
      if (enabled.length > 0 && !enabled.includes(data.kids_category)) return error(res, 'Content not found', 404);
    }

    // Prefer explicit YouTube ID when present.
    const youtubeVideoId = data.youtube_video_id || null;
    let streamUrl = data.source_url || null;

    // Fallback to sample video (for testing without actual content URLs)
    if (!streamUrl) {
      streamUrl = 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4';
    }

    return success(res, { 
      streamUrl,
      youtubeVideoId,
      sourceType: data.source_type || (youtubeVideoId ? 'youtube' : 'external'),
      contentId: id,
      title: data.title,
      duration: '45:30' // Will be calculated based on actual video
    });
  } catch (err) { next(err); }
};

// Increment view count — one view per profile per content
exports.incrementViewCount = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    if (!profileId) return error(res, 'Profile ID required', 400);
    const { id } = req.params;
    if (!id) return error(res, 'Content ID required', 400);

    // Check if this profile already viewed this content
    const { data: existing } = await supabase
      .from('content_views')
      .select('id')
      .eq('profile_id', profileId)
      .eq('content_id', id)
      .maybeSingle();

    if (!existing) {
      // Record new view
      await supabase.from('content_views').insert({
        profile_id: profileId,
        content_id: id,
        viewed_at: new Date().toISOString(),
      });

      // Increment view_count on content table
      const { data: content } = await supabase
        .from('content')
        .select('view_count')
        .eq('id', id)
        .single();

      if (content) {
        await supabase
          .from('content')
          .update({ view_count: (content.view_count || 0) + 1 })
          .eq('id', id);
      }
    }

    return success(res, null, 'View recorded');
  } catch (err) { next(err); }
};
