-- Batch import for content table (aligned to current Islam Learning Platform schema)
-- Safe features:
-- 1) Creates missing scholars/topics used by this batch
-- 2) Normalizes known name variants (e.g., Tariq Jamil vs Tariq Jameel)
-- 3) Upserts by youtube_video_id to avoid duplicate videos

begin;

-- Ensure we can upsert by YouTube video id (non-partial unique index).
-- 1) Normalize blank IDs to NULL
update public.content
set youtube_video_id = null
where trim(coalesce(youtube_video_id, '')) = '';

-- 2) Remove duplicates if any (keep newest row)
with ranked as (
  select
    id,
    youtube_video_id,
    row_number() over (
      partition by youtube_video_id
      order by created_at desc nulls last, id desc
    ) as rn
  from public.content
  where youtube_video_id is not null
)
delete from public.content c
using ranked r
where c.id = r.id
  and r.rn > 1;

-- 3) Create/refresh unique index
drop index if exists ux_content_youtube_video_id;
create unique index ux_content_youtube_video_id
on public.content (youtube_video_id);

-- Ensure required scholars exist
insert into public.scholars (name, image, bio, lectures)
select s.name, '', '', 0
from (
  values
    ('Nouman Ali Khan'),
    ('Yasir Qadhi'),
    ('Mufti Menk'),
    ('Assim Al Hakeem'),
    ('Omar Suleiman'),
    ('Tariq Jameel')
) as s(name)
where not exists (
  select 1
  from public.scholars sc
  where lower(sc.name) = lower(s.name)
);

-- Alias fix: if DB has Tariq Jamil but not Tariq Jameel, create canonical row
insert into public.scholars (name, image, bio, lectures)
select 'Tariq Jameel', coalesce(j.image, ''), coalesce(j.bio, ''), coalesce(j.lectures, 0)
from public.scholars j
where lower(j.name) = 'tariq jamil'
  and not exists (
    select 1 from public.scholars t where lower(t.name) = 'tariq jameel'
  )
limit 1;

-- Ensure required topics exist
insert into public.topics (name, icon, color)
select t.name, 'book', '#2DD4BF'
from (
  values
    ('Seerah'),
    ('Fiqh'),
    ('Hadith'),
    ('Family & Marriage')
) as t(name)
where not exists (
  select 1
  from public.topics tp
  where lower(tp.name) = lower(t.name)
);

with input_rows as (
  select *
  from (
    values
      -- ================= SEERAH =================
      (
        'Understanding Seerah through Ibrahim',
        'Nouman Ali Khan',
        'Seerah',
        'https://i.ytimg.com/vi/_R8JBhLfTVc/hqdefault.jpg',
        '18:30',
        1110,
        'Deep connection between Prophet Ibrahim and Seerah.',
        'youtube',
        'https://www.youtube.com/watch?v=_R8JBhLfTVc',
        '_R8JBhLfTVc',
        4.9,
        500000,
        true,
        true,
        array['Knowledge','Reflective']::text[]
      ),
      (
        'Life of Prophet Muhammad (Seerah Intro)',
        'Yasir Qadhi',
        'Seerah',
        'https://i.ytimg.com/vi/VOUp3ZZ9t3A/hqdefault.jpg',
        '1:05:00',
        3900,
        'Introduction to Seerah series.',
        'youtube',
        'https://www.youtube.com/watch?v=VOUp3ZZ9t3A',
        'VOUp3ZZ9t3A',
        5.0,
        2000000,
        false,
        true,
        array['Knowledge']::text[]
      ),
      (
        'Seerah Motivation Reminder',
        'Mufti Menk',
        'Seerah',
        'https://i.ytimg.com/vi/2z5zF0y7e0Y/hqdefault.jpg',
        '25:10',
        1510,
        'Lessons from the life of Prophet ﷺ.',
        'youtube',
        'https://www.youtube.com/watch?v=2z5zF0y7e0Y',
        '2z5zF0y7e0Y',
        4.8,
        900000,
        true,
        true,
        array['Motivation']::text[]
      ),
      -- ================= AQEEQAH (mapped to FIQH) =================
      (
        'Aqeeqah Explained',
        'Assim Al Hakeem',
        'Fiqh',
        'https://i.ytimg.com/vi/W9l0L7Xh4xA/hqdefault.jpg',
        '10:05',
        605,
        'What is Aqeeqah and its rulings.',
        'youtube',
        'https://www.youtube.com/watch?v=W9l0L7Xh4xA',
        'W9l0L7Xh4xA',
        4.7,
        300000,
        false,
        false,
        array['Knowledge']::text[]
      ),
      (
        'Importance of Aqeeqah',
        'Mufti Menk',
        'Fiqh',
        'https://i.ytimg.com/vi/tz4t0d2lG0A/hqdefault.jpg',
        '12:20',
        740,
        'Significance of Aqeeqah in Islam.',
        'youtube',
        'https://www.youtube.com/watch?v=tz4t0d2lG0A',
        'tz4t0d2lG0A',
        4.8,
        250000,
        false,
        false,
        array['Knowledge']::text[]
      ),
      -- ================= HADITH =================
      (
        'Importance of Hadith',
        'Nouman Ali Khan',
        'Hadith',
        'https://i.ytimg.com/vi/AR3FW6Mktgo/hqdefault.jpg',
        '30:00',
        1800,
        'Understanding Hadith in Islam.',
        'youtube',
        'https://www.youtube.com/watch?v=AR3FW6Mktgo',
        'AR3FW6Mktgo',
        4.9,
        1200000,
        true,
        true,
        array['Knowledge']::text[]
      ),
      (
        'Daily Hadith Reminder',
        'Omar Suleiman',
        'Hadith',
        'https://i.ytimg.com/vi/qJYTs_fUmlQ/hqdefault.jpg',
        '15:00',
        900,
        'Short hadith reflections.',
        'youtube',
        'https://www.youtube.com/watch?v=qJYTs_fUmlQ',
        'qJYTs_fUmlQ',
        4.9,
        800000,
        true,
        false,
        array['Reflective']::text[]
      ),
      -- ================= FAMILY =================
      (
        'Marriage in Islam',
        'Omar Suleiman',
        'Family & Marriage',
        'https://i.ytimg.com/vi/_zZmKMac8wE/hqdefault.jpg',
        '38:45',
        2325,
        'Understanding Islamic marriage.',
        'youtube',
        'https://www.youtube.com/watch?v=_zZmKMac8wE',
        '_zZmKMac8wE',
        4.9,
        1500000,
        false,
        true,
        array['Peaceful']::text[]
      ),
      (
        'Rights of Parents',
        'Mufti Menk',
        'Family & Marriage',
        'https://i.ytimg.com/vi/y9NzKvY_kco/hqdefault.jpg',
        '20:10',
        1210,
        'Importance of respecting parents.',
        'youtube',
        'https://www.youtube.com/watch?v=y9NzKvY_kco',
        'y9NzKvY_kco',
        4.9,
        1800000,
        true,
        true,
        array['Emotional','Reflective']::text[]
      ),
      (
        'Family Life in Islam',
        'Tariq Jameel',
        'Family & Marriage',
        'https://i.ytimg.com/vi/7k0hQy0Ww9A/hqdefault.jpg',
        '35:00',
        2100,
        'Importance of family in Islam.',
        'youtube',
        'https://www.youtube.com/watch?v=7k0hQy0Ww9A',
        '7k0hQy0Ww9A',
        4.9,
        2200000,
        true,
        true,
        array['Motivation']::text[]
      )
  ) as v(
    title,
    scholar_name,
    topic_name,
    thumbnail,
    duration,
    duration_seconds,
    description,
    source_type,
    source_url,
    youtube_video_id,
    rating,
    view_count,
    is_new,
    is_trending,
    mood_tags
  )
),
resolved as (
  select
    i.*,
    (
      select sc.id
      from public.scholars sc
      where lower(sc.name) = lower(i.scholar_name)
      order by sc.created_at asc
      limit 1
    ) as scholar_id_resolved,
    (
      select tp.id
      from public.topics tp
      where lower(tp.name) = lower(i.topic_name)
      order by tp.created_at asc
      limit 1
    ) as topic_id_resolved
  from input_rows i
)
insert into public.content (
  title,
  scholar_id,
  topic_id,
  thumbnail,
  duration,
  duration_seconds,
  description,
  source_type,
  source_url,
  youtube_video_id,
  rating,
  view_count,
  is_new,
  is_trending,
  mood_tags
)
select
  r.title,
  r.scholar_id_resolved,
  r.topic_id_resolved,
  r.thumbnail,
  r.duration,
  r.duration_seconds,
  r.description,
  r.source_type,
  r.source_url,
  r.youtube_video_id,
  r.rating,
  r.view_count,
  r.is_new,
  r.is_trending,
  r.mood_tags
from resolved r
where r.scholar_id_resolved is not null
  and r.topic_id_resolved is not null
on conflict (youtube_video_id) do update
set
  title = excluded.title,
  scholar_id = excluded.scholar_id,
  topic_id = excluded.topic_id,
  thumbnail = excluded.thumbnail,
  duration = excluded.duration,
  duration_seconds = excluded.duration_seconds,
  description = excluded.description,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  rating = excluded.rating,
  view_count = excluded.view_count,
  is_new = excluded.is_new,
  is_trending = excluded.is_trending,
  mood_tags = excluded.mood_tags;

commit;

-- Optional check:
-- select title, youtube_video_id, source_type, topic_id, scholar_id from public.content
-- where youtube_video_id in (
--   '_R8JBhLfTVc','VOUp3ZZ9t3A','2z5zF0y7e0Y','W9l0L7Xh4xA','tz4t0d2lG0A',
--   'AR3FW6Mktgo','qJYTs_fUmlQ','_zZmKMac8wE','y9NzKvY_kco','7k0hQy0Ww9A'
-- );
