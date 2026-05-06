const supabase = require('../config/db');
const { success, error } = require('../utils/apiResponse');

exports.getBooks = async (req, res, next) => {
  try {
    const { data } = await supabase.from('books').select('*').order('title');
    return success(res, data);
  } catch (err) { next(err); }
};

exports.getAudiobooks = async (req, res, next) => {
  try {
    const { data } = await supabase.from('audiobooks').select('*').order('title');
    return success(res, data);
  } catch (err) { next(err); }
};

exports.getBookById = async (req, res, next) => {
  try {
    const { data, error: dbErr } = await supabase
      .from('books')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (dbErr) return error(res, dbErr.message, 400);
    if (!data) return error(res, 'Book not found', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

exports.getAudiobookById = async (req, res, next) => {
  try {
    const { data, error: dbErr } = await supabase
      .from('audiobooks')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (dbErr) return error(res, dbErr.message, 400);
    if (!data) return error(res, 'Audiobook not found', 404);
    return success(res, data);
  } catch (err) { next(err); }
};
