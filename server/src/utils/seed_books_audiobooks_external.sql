-- Insert books (PDFs) + audiobooks (external MP3s)
-- Matches public.books / public.audiobooks from migration.sql
-- Safe-ish: skips row if identical title already exists.

begin;

-- ── BOOKS ───────────────────────────────────────────────────
insert into public.books (title, author, cover, pages, rating, description, pdf_url)
select v.title, v.author, '', 0, v.rating, v.description, v.pdf_url
from (
  values
    (
      'The Sealed Nectar (Ar-Raheeq Al-Makhtum)',
      'Safiur Rahman Mubarakpuri',
      4.9::numeric,
      'Seerah • English — The award-winning biography of Prophet Muhammad ﷺ — winner of the first prize by the World Muslim League. A complete and authoritative account.'::text,
      'https://archive.org/download/the-sealed-nectar-ar-raheeq-al-makhtum-english/The%20Sealed%20Nectar%20-%20Ar-Raheeq%20Al-Makhtum%20-%20English.pdf'::text
    ),
    (
      'Purification of the Soul',
      'Ahmad Farid',
      4.8::numeric,
      'Spirituality • English — A comprehensive guide to the purification of the heart and soul based on the Quran, Sunnah, and works of the classical scholars.'::text,
      'https://archive.org/download/islamicbooksfromkalamullahcollection/Purification%20of%20the%20Soul.pdf'::text
    ),
    (
      'The Sealed Nectar — Full Color Edition',
      'Safiur Rahman Mubarakpuri',
      4.9::numeric,
      'Seerah • English — Full-color illustrated edition of the acclaimed biography of Prophet Muhammad ﷺ with maps and images.'::text,
      'https://archive.org/download/sealed-nectar-color/Sealed%20Nectar%20Color.pdf'::text
    ),
    (
      'Stories of the Prophets',
      'Imam Ibn Kathir',
      4.8::numeric,
      'Seerah • English — Accounts of all the prophets mentioned in the Quran, drawn from Quranic verses and authentic hadiths.'::text,
      'https://archive.org/download/BestPopularIslamicBooks/Stories%20of%20the%20Prophets%20Ibn%20Kathir.pdf'::text
    )
) as v(title, author, rating, description, pdf_url)
where not exists (select 1 from public.books b where lower(b.title) = lower(v.title));

-- ── AUDIOBOOKS (Quran MP3 streams) ─────────────────────────
insert into public.audiobooks (title, narrator, cover, duration, rating, source_url)
select v.title, v.narrator, '', '', v.rating, v.source_url
from (
  values
    -- Mishary Rashid Al-Afasy
    ('Surah Al-Fatiha — Mishary Al-Afasy', 'Mishary Rashid Al-Afasy', 5.0::numeric, 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/001.mp3'::text),
    ('Surah Al-Baqarah — Mishary Al-Afasy', 'Mishary Rashid Al-Afasy', 5.0::numeric, 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/002.mp3'::text),
    ('Surah Al-Kahf — Mishary Al-Afasy', 'Mishary Rashid Al-Afasy', 5.0::numeric, 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/018.mp3'::text),
    ('Surah Yaseen — Mishary Al-Afasy', 'Mishary Rashid Al-Afasy', 5.0::numeric, 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/036.mp3'::text),
    ('Surah Ar-Rahman — Mishary Al-Afasy', 'Mishary Rashid Al-Afasy', 5.0::numeric, 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/055.mp3'::text),
    ('Surah Al-Mulk — Mishary Al-Afasy', 'Mishary Rashid Al-Afasy', 5.0::numeric, 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/067.mp3'::text),
    ('Surah Al-Waqi''ah — Mishary Al-Afasy', 'Mishary Rashid Al-Afasy', 5.0::numeric, 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/056.mp3'::text),
    ('Surah Al-Ikhlas, Al-Falaq, An-Nas — Mishary Al-Afasy', 'Mishary Rashid Al-Afasy', 5.0::numeric, 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/112.mp3'::text),
    -- Abdul Basit Abdus Samad (Mujawwad)
    ('Surah Al-Fatiha — Abdul Basit Abdus Samad', 'Abdul Basit Abdus Samad', 5.0::numeric, 'https://download.quranicaudio.com/quran/abdulbaset/001.mp3'::text),
    ('Surah Al-Baqarah — Abdul Basit Abdus Samad', 'Abdul Basit Abdus Samad', 5.0::numeric, 'https://download.quranicaudio.com/quran/abdulbaset/002.mp3'::text),
    ('Surah Maryam — Abdul Basit Abdus Samad', 'Abdul Basit Abdus Samad', 5.0::numeric, 'https://download.quranicaudio.com/quran/abdulbaset/019.mp3'::text),
    ('Surah Yaseen — Abdul Basit Abdus Samad', 'Abdul Basit Abdus Samad', 5.0::numeric, 'https://download.quranicaudio.com/quran/abdulbaset/036.mp3'::text),
    -- Abdur Rahman As-Sudais
    ('Surah Al-Fatiha — Abdur Rahman As-Sudais', 'Abdur Rahman As-Sudais', 5.0::numeric, 'https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/001.mp3'::text),
    ('Surah Al-Kahf — Abdur Rahman As-Sudais', 'Abdur Rahman As-Sudais', 5.0::numeric, 'https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/018.mp3'::text),
    ('Surah Ar-Rahman — Abdur Rahman As-Sudais', 'Abdur Rahman As-Sudais', 5.0::numeric, 'https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/055.mp3'::text),
    -- Saud Al-Shuraim
    ('Surah Al-Baqarah — Saud Al-Shuraim', 'Saud Al-Shuraim', 5.0::numeric, 'https://download.quranicaudio.com/quran/sa3ood_al-shuraym/002.mp3'::text),
    ('Surah Al-Imran — Saud Al-Shuraim', 'Saud Al-Shuraim', 5.0::numeric, 'https://download.quranicaudio.com/quran/sa3ood_al-shuraym/003.mp3'::text),
    -- Mahmoud Khalil Al-Husary (Muallim)
    ('Surah Al-Fatiha — Mahmoud Khalil Al-Husary (Muallim)', 'Mahmoud Khalil Al-Husary', 5.0::numeric, 'https://download.quranicaudio.com/quran/mahmood_khaleel_al-husaree_muallim/001.mp3'::text),
    ('Surah Al-Baqarah — Mahmoud Khalil Al-Husary (Muallim)', 'Mahmoud Khalil Al-Husary', 5.0::numeric, 'https://download.quranicaudio.com/quran/mahmood_khaleel_al-husaree_muallim/002.mp3'::text)
) as v(title, narrator, rating, source_url)
where not exists (
  select 1 from public.audiobooks a
  where lower(a.title) = lower(v.title)
    and lower(a.narrator) = lower(v.narrator)
);

commit;
