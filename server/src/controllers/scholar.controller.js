const supabase = require('../config/db');
const { success, error } = require('../utils/apiResponse');

exports.getScholars = async (req, res, next) => {
  try {
    const { data: scholars } = await supabase.from('scholars').select('*').order('name');

    // Dynamically count lectures for each scholar from the content table
    const scholarIds = (scholars || []).map((s) => s.id);
    let lectureCounts = {};
    if (scholarIds.length > 0) {
      const { data: counts } = await supabase
        .from('content')
        .select('scholar_id')
        .in('scholar_id', scholarIds);
      for (const row of counts || []) {
        lectureCounts[row.scholar_id] = (lectureCounts[row.scholar_id] || 0) + 1;
      }
    }

    const enriched = (scholars || []).map((s) => ({
      ...s,
      lectures: lectureCounts[s.id] || 0,
    }));

    return success(res, enriched);
  } catch (err) { next(err); }
};

exports.getScholarById = async (req, res, next) => {
  try {
    const { data: scholar } = await supabase.from('scholars').select('*').eq('id', req.params.id).single();
    if (!scholar) return error(res, 'Scholar not found', 404);

    const { data: lectures } = await supabase
      .from('content')
      .select('*, topics:topic_id(name, color)')
      .eq('scholar_id', scholar.id)
      .order('published_at', { ascending: false });

    // Enrich scholar with dynamic lecture count
    scholar.lectures = (lectures || []).length;

    return success(res, { scholar, lectures });
  } catch (err) { next(err); }
};
