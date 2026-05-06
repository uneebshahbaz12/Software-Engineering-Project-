begin;

-- Ensure ON CONFLICT (youtube_video_id) works safely:
-- 1) normalize empty IDs to NULL
-- 2) remove duplicates
-- 3) create non-partial unique index
update public.content
set youtube_video_id = null
where trim(coalesce(youtube_video_id, '')) = '';

with dupes as (
  select
    id,r
    row_number() over (
      partition by youtube_video_id
      order by created_at desc nulls last, id desc
    ) as rn
  from public.content
  where youtube_video_id is not null
)
delete from public.content c
using dupes d
where c.id = d.id
  and d.rn > 1;

create unique index if not exists ux_content_youtube_video_id
  on public.content (youtube_video_id);

-- 1) Ensure kids-safe topics exist
insert into public.topics (name, color)
select v.name, v.color
from (
  values
    ('Kids Quran', '#22C55E'),
    ('Kids Seerah', '#3B82F6'),
    ('Kids Adab', '#F59E0B'),
    ('Kids Duas', '#A855F7'),
    ('Kids Stories', '#EF4444')
) as v(name, color)
where not exists (
  select 1
  from public.topics t
  where lower(trim(t.name)) = lower(trim(v.name))
);

-- 2) Ensure scholars/channels for kids exist
insert into public.scholars (name, image, bio)
select v.name, v.image, v.bio
from (
  values
    ('Kids Learning Hub', null, 'Safe Islamic learning for children'),
    ('Quran for Kids', null, 'Simple Quran lessons for children'),
    ('Seerah for Children', null, 'Prophetic stories for children')
) as v(name, image, bio)
where not exists (
  select 1
  from public.scholars s
  where lower(trim(s.name)) = lower(trim(v.name))
);

-- 3) Seed kids content with upsert protection on youtube_video_id
insert into public.content
(
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
  is_kids_content,
  kids_category,
  mood_tags
)
values
(
  'Surah Al-Fatihah for Kids',
  (select id from public.scholars where name = 'Quran for Kids' limit 1),
  (select id from public.topics where name = 'Kids Quran' limit 1),
  'https://i.ytimg.com/vi/s6f_2k5JQnA/hqdefault.jpg',
  '07:40',
  460,
  'Easy recitation and meaning for children.',
  'youtube',
  'https://www.youtube.com/watch?v=s6f_2k5JQnA',
  's6f_2k5JQnA',
  4.8,
  120000,
  true,
  true,
  true,
  'quran',
  array['Kids','Quran']::text[]
),
(
  'Wudu Steps for Children',
  (select id from public.scholars where name = 'Kids Learning Hub' limit 1),
  (select id from public.topics where name = 'Kids Adab' limit 1),
  'https://i.ytimg.com/vi/6fS2xNQfE8w/hqdefault.jpg',
  '05:20',
  320,
  'How to perform wudu in a simple way.',
  'youtube',
  'https://www.youtube.com/watch?v=6fS2xNQfE8w',
  '6fS2xNQfE8w',
  4.7,
  80000,
  false,
  false,
  true,
  'adab',
  array['Kids','Practice']::text[]
),
(
  'Story of Prophet Nuh for Kids',
  (select id from public.scholars where name = 'Seerah for Children' limit 1),
  (select id from public.topics where name = 'Kids Stories' limit 1),
  'https://i.ytimg.com/vi/KvBq8l0zP4M/hqdefault.jpg',
  '11:10',
  670,
  'A child-friendly story from the prophets.',
  'youtube',
  'https://www.youtube.com/watch?v=KvBq8l0zP4M',
  'KvBq8l0zP4M',
  4.9,
  160000,
  true,
  true,
  true,
  'stories',
  array['Kids','Seerah']::text[]
),
(
  'Morning Duas for Kids',
  (select id from public.scholars where name = 'Kids Learning Hub' limit 1),
  (select id from public.topics where name = 'Kids Duas' limit 1),
  'https://i.ytimg.com/vi/Jwpl0z5BphA/hqdefault.jpg',
  '06:35',
  395,
  'Daily morning duas memorization for children.',
  'youtube',
  'https://www.youtube.com/watch?v=Jwpl0z5BphA',
  'Jwpl0z5BphA',
  4.8,
  110000,
  true,
  false,
  true,
  'duas',
  array['Kids','Dua']::text[]
)
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
  is_kids_content = excluded.is_kids_content,
  kids_category = excluded.kids_category,
  mood_tags = excluded.mood_tags;

commit;
