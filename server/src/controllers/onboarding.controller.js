const supabase = require('../config/db');
const { success } = require('../utils/apiResponse');

exports.savePreferences = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const { profession, familyRole, field, interests, challenges } = req.body;

    const { data } = await supabase
      .from('onboarding_preferences')
      .upsert({
        profile_id: profileId,
        profession: profession || '',
        family_role: familyRole || '',
        field: field || '',
        interests: interests || [],
        challenges: challenges || [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' })
      .select()
      .single();

    return success(res, data, 'Preferences saved', 201);
  } catch (err) { next(err); }
};

exports.getPreferences = async (req, res, next) => {
  try {
    const { data } = await supabase
      .from('onboarding_preferences')
      .select('*')
      .eq('profile_id', req.params.profileId)
      .single();

    return success(res, data);
  } catch (err) { next(err); }
};
