const bcrypt = require('bcryptjs');
const supabase = require('../config/db');
const { success, error } = require('../utils/apiResponse');

exports.getProfiles = async (req, res, next) => {
  try {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', req.user.userId);
    return success(res, data);
  } catch (err) { next(err); }
};

exports.createProfile = async (req, res, next) => {
  try {
    const { data: existing } = await supabase.from('profiles').select('id').eq('user_id', req.user.userId);
    if (existing && existing.length >= 5) return error(res, 'Maximum 5 profiles allowed', 400);

    const body = { user_id: req.user.userId, name: req.body.name, color: req.body.color, is_kids: req.body.isKids || false };
    if (req.body.pin) body.pin = await bcrypt.hash(req.body.pin, 10);

    const { data, error: dbErr } = await supabase.from('profiles').insert(body).select().single();
    if (dbErr) return error(res, dbErr.message, 400);

    // Ensure onboarding_preferences row exists for every profile.
    // This makes profile-specific personalization updates straightforward later.
    await supabase
      .from('onboarding_preferences')
      .upsert(
        {
          profile_id: data.id,
          profession: '',
          family_role: '',
          field: '',
          interests: [],
          challenges: [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id' }
      );

    return success(res, data, 'Profile created', 201);
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.color) updates.color = req.body.color;
    if (req.body.pin) updates.pin = await bcrypt.hash(req.body.pin, 10);
    if (req.body.enabledCategories) updates.enabled_categories = req.body.enabledCategories;
    if (typeof req.body.isKids === 'boolean') updates.is_kids = req.body.isKids;

    const { data, error: dbErr } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (dbErr || !data) return error(res, 'Profile not found', 404);
    return success(res, data, 'Profile updated');
  } catch (err) { next(err); }
};

exports.deleteProfile = async (req, res, next) => {
  try {
    const { error: dbErr } = await supabase
      .from('profiles')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId);

    if (dbErr) return error(res, 'Profile not found', 404);
    return success(res, null, 'Profile deleted');
  } catch (err) { next(err); }
};

exports.verifyPin = async (req, res, next) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (!profile) return error(res, 'Profile not found', 404);
    if (!profile.pin) return success(res, { profileId: profile.id }, 'No PIN required');

    const isMatch = await bcrypt.compare(req.body.pin, profile.pin);
    if (!isMatch) return error(res, 'Incorrect PIN', 401);

    return success(res, { profileId: profile.id }, 'PIN verified');
  } catch (err) { next(err); }
};
