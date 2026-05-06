const crypto = require('crypto');
const supabase = require('../config/db');
const { success, error } = require('../utils/apiResponse');

exports.getGatherings = async (req, res, next) => {
  try {
    const { data } = await supabase
      .from('gatherings')
      .select('*, host:host_profile_id(name, color), content:content_id(title, thumbnail), gathering_participants(profile_id)')
      .eq('is_live', true)
      .order('created_at', { ascending: false });

    return success(res, data);
  } catch (err) { next(err); }
};

exports.createGathering = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    const { name, contentId } = req.body;
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const { data: gathering, error: dbErr } = await supabase
      .from('gatherings')
      .insert({ name, host_profile_id: profileId, content_id: contentId, invite_code: inviteCode })
      .select()
      .single();

    if (dbErr) return error(res, dbErr.message, 400);

    // Add host as participant
    await supabase.from('gathering_participants').insert({ gathering_id: gathering.id, profile_id: profileId });

    return success(res, gathering, 'Gathering created', 201);
  } catch (err) { next(err); }
};

exports.joinGathering = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    const { data: gathering } = await supabase
      .from('gatherings')
      .select('*, gathering_participants(profile_id)')
      .eq('invite_code', req.params.inviteCode)
      .eq('is_live', true)
      .single();

    if (!gathering) return error(res, 'Gathering not found or ended', 404);
    if (gathering.gathering_participants.length >= gathering.max_participants) return error(res, 'Gathering is full', 400);

    const already = gathering.gathering_participants.some((p) => p.profile_id === profileId);
    if (already) return error(res, 'Already in this gathering', 400);

    await supabase.from('gathering_participants').insert({ gathering_id: gathering.id, profile_id: profileId });

    return success(res, gathering, 'Joined gathering');
  } catch (err) { next(err); }
};

exports.leaveGathering = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    const { data: gathering } = await supabase
      .from('gatherings')
      .select('id, host_profile_id')
      .eq('invite_code', req.params.inviteCode)
      .single();

    if (!gathering) return error(res, 'Gathering not found', 404);

    await supabase.from('gathering_participants').delete().eq('gathering_id', gathering.id).eq('profile_id', profileId);

    // Check if empty
    const { count } = await supabase.from('gathering_participants').select('id', { count: 'exact' }).eq('gathering_id', gathering.id);
    if (count === 0) {
      await supabase.from('gatherings').update({ is_live: false, ended_at: new Date().toISOString() }).eq('id', gathering.id);
    } else if (String(gathering.host_profile_id) === String(profileId)) {
      // Host left: transfer host role to earliest remaining participant.
      const { data: nextHost } = await supabase
        .from('gathering_participants')
        .select('profile_id')
        .eq('gathering_id', gathering.id)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (nextHost?.profile_id) {
        await supabase
          .from('gatherings')
          .update({ host_profile_id: nextHost.profile_id })
          .eq('id', gathering.id);
      }
    }

    return success(res, null, 'Left gathering');
  } catch (err) { next(err); }
};

exports.endGathering = async (req, res, next) => {
  try {
    const profileId = req.headers['x-profile-id'];
    const { data: gathering } = await supabase
      .from('gatherings')
      .select('id, host_profile_id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!gathering?.id) return error(res, 'Gathering not found', 404);
    if (String(gathering.host_profile_id) !== String(profileId)) {
      return error(res, 'Only host can end this gathering', 403);
    }

    await supabase.from('gatherings').update({ is_live: false, ended_at: new Date().toISOString() }).eq('id', req.params.id);
    return success(res, null, 'Gathering ended');
  } catch (err) { next(err); }
};
