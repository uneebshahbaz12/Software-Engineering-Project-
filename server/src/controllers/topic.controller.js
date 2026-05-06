const supabase = require('../config/db');
const { success, error } = require('../utils/apiResponse');

exports.getTopics = async (req, res, next) => {
  try {
    const { data } = await supabase.from('topics').select('*').order('name');
    return success(res, data);
  } catch (err) { next(err); }
};

exports.getTopicById = async (req, res, next) => {
  try {
    const { data: topic } = await supabase.from('topics').select('*').eq('id', req.params.id).single();
    if (!topic) return error(res, 'Topic not found', 404);

    const { data: lectures } = await supabase
      .from('content')
      .select('*, scholars:scholar_id(name, image)')
      .eq('topic_id', topic.id)
      .order('published_at', { ascending: false });

    return success(res, { topic, lectures });
  } catch (err) { next(err); }
};
