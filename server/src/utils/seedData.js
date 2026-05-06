const supabase = require('../config/db');

async function seed() {
  try {
    console.log('Clearing existing data...');
    await supabase.from('watch_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('watchlist').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('gathering_participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('gatherings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('content').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('audiobooks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('books').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('topics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('scholars').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Seeding scholars...');
    const { data: createdScholars } = await supabase.from('scholars').insert([
      { name: 'Mufti Menk', image: 'https://picsum.photos/seed/scholar1/200/200', bio: 'Internationally renowned Islamic scholar', lectures: 245 },
      { name: 'Nouman Ali Khan', image: 'https://picsum.photos/seed/scholar2/200/200', bio: 'Founder of Bayyinah Institute', lectures: 189 },
      { name: 'Omar Suleiman', image: 'https://picsum.photos/seed/scholar3/200/200', bio: 'President of Yaqeen Institute', lectures: 156 },
      { name: 'Yasir Qadhi', image: 'https://picsum.photos/seed/scholar4/200/200', bio: 'Dean of Academic Affairs at AlMaghrib Institute', lectures: 312 },
      { name: 'Tariq Jameel', image: 'https://picsum.photos/seed/scholar5/200/200', bio: 'Pakistani Islamic scholar and preacher', lectures: 420 },
      { name: 'Zakir Naik', image: 'https://picsum.photos/seed/scholar6/200/200', bio: 'Islamic public speaker and writer', lectures: 198 },
    ]).select();

    const s = {};
    createdScholars.forEach((sc) => { s[sc.name] = sc.id; });

    console.log('Seeding topics...');
    const { data: createdTopics } = await supabase.from('topics').insert([
      { name: 'Quran Tafsir', icon: 'book', color: '#2DD4BF' },
      { name: 'Hadith', icon: 'document-text', color: '#FBBF24' },
      { name: 'Seerah', icon: 'heart', color: '#818CF8' },
      { name: 'Fiqh', icon: 'scale', color: '#F472B6' },
      { name: 'Aqeedah', icon: 'shield-checkmark', color: '#38BDF8' },
      { name: 'Islamic History', icon: 'time', color: '#FB923C' },
      { name: 'Family & Marriage', icon: 'people', color: '#F472B6' },
      { name: 'Youth', icon: 'flash', color: '#818CF8' },
      { name: 'Purification of Soul', icon: 'leaf', color: '#2DD4BF' },
      { name: 'Daily Reminders', icon: 'notifications', color: '#FBBF24' },
    ]).select();

    const t = {};
    createdTopics.forEach((tp) => { t[tp.name] = tp.id; });

    console.log('Seeding lectures...');
    await supabase.from('content').insert([
      { title: 'The Power of Dua', scholar_id: s['Mufti Menk'], topic_id: t['Purification of Soul'], source_url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4', thumbnail: 'https://picsum.photos/seed/lec1/400/225', duration: '45:30', duration_seconds: 2730, description: 'Learn about the importance and power of making dua in Islam.', rating: 4.8, view_count: 1200000, is_new: true, is_trending: true, mood_tags: ['Peaceful', 'Reflective'] },
      { title: 'Stories of the Prophets', scholar_id: s['Nouman Ali Khan'], topic_id: t['Seerah'], source_url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ElephantsDream.mp4', thumbnail: 'https://picsum.photos/seed/lec2/400/225', duration: '1:02:15', duration_seconds: 3735, description: 'A beautiful narration of the stories of Prophets mentioned in the Quran.', rating: 4.9, view_count: 890000, is_new: true, is_trending: true, mood_tags: ['Seeking Knowledge', 'Reflective'] },
      { title: 'Understanding Surah Al-Kahf', scholar_id: s['Yasir Qadhi'], topic_id: t['Quran Tafsir'], source_url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp4', thumbnail: 'https://picsum.photos/seed/lec3/400/225', duration: '55:00', duration_seconds: 3300, description: 'Deep dive into the meanings and lessons of Surah Al-Kahf.', rating: 4.7, view_count: 650000, is_trending: true, mood_tags: ['Seeking Knowledge'] },
      { title: 'Marriage in Islam', scholar_id: s['Omar Suleiman'], topic_id: t['Family & Marriage'], source_url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerEscapes.mp4', thumbnail: 'https://picsum.photos/seed/lec4/400/225', duration: '38:45', duration_seconds: 2325, description: 'Understanding the beautiful institution of marriage in Islam.', rating: 4.9, view_count: 1500000, mood_tags: ['Peaceful'] },
      { title: 'The Last Sermon', scholar_id: s['Tariq Jameel'], topic_id: t['Seerah'], source_url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerFun.mp4', thumbnail: 'https://picsum.photos/seed/lec5/400/225', duration: '1:15:00', duration_seconds: 4500, description: 'An emotional narration of the last sermon of Prophet Muhammad (PBUH).', rating: 5.0, view_count: 2100000, is_new: true, is_trending: true, mood_tags: ['Motivated', 'Reflective'] },
      { title: 'Basics of Fiqh', scholar_id: s['Zakir Naik'], topic_id: t['Fiqh'], source_url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/Sintel.mp4', thumbnail: 'https://picsum.photos/seed/lec6/400/225', duration: '42:20', duration_seconds: 2540, description: 'Introduction to Islamic jurisprudence and its principles.', rating: 4.6, view_count: 780000, mood_tags: ['Seeking Knowledge'] },
      { title: 'Patience in Trials', scholar_id: s['Mufti Menk'], topic_id: t['Purification of Soul'], source_url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/SubaruOutbackOnstraNH.mp4', thumbnail: 'https://picsum.photos/seed/lec7/400/225', duration: '35:10', duration_seconds: 2110, description: 'How to remain patient during the trials and tribulations of life.', rating: 4.8, view_count: 920000, is_new: true, mood_tags: ['Anxious', 'Peaceful'] },
      { title: 'Youth & Social Media', scholar_id: s['Nouman Ali Khan'], topic_id: t['Youth'], source_url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/TearsOfSteel.mp4', thumbnail: 'https://picsum.photos/seed/lec8/400/225', duration: '48:55', duration_seconds: 2935, description: 'Navigating social media as a Muslim youth in the modern world.', rating: 4.7, view_count: 1800000, is_trending: true, mood_tags: ['Motivated'] },
      { title: 'The Battle of Badr', scholar_id: s['Yasir Qadhi'], topic_id: t['Islamic History'], source_url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/VolunteersCloseUp.mp4', thumbnail: 'https://picsum.photos/seed/lec9/400/225', duration: '1:20:00', duration_seconds: 4800, description: 'Detailed account of the first major battle in Islamic history.', rating: 4.9, view_count: 560000, mood_tags: ['Seeking Knowledge', 'Motivated'] },
      { title: 'Daily Adhkar', scholar_id: s['Omar Suleiman'], topic_id: t['Daily Reminders'], source_url: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/WeAreGoingOnBullrun.mp4', thumbnail: 'https://picsum.photos/seed/lec10/400/225', duration: '25:30', duration_seconds: 1530, description: 'Essential daily remembrances every Muslim should practice.', rating: 4.8, view_count: 2500000, is_new: true, is_trending: true, mood_tags: ['Peaceful', 'Grateful'] },
    ]);

    console.log('Seeding books...');
    await supabase.from('books').insert([
      { title: 'Riyad as-Salihin', author: 'Imam Nawawi', cover: 'https://picsum.photos/seed/book1/200/300', pages: 680, rating: 4.9 },
      { title: 'The Sealed Nectar', author: 'Safiur Rahman', cover: 'https://picsum.photos/seed/book2/200/300', pages: 480, rating: 4.8 },
      { title: 'Fortress of the Muslim', author: 'Saeed Al-Qahtani', cover: 'https://picsum.photos/seed/book3/200/300', pages: 256, rating: 4.9 },
      { title: 'Stories of the Prophets', author: 'Ibn Kathir', cover: 'https://picsum.photos/seed/book4/200/300', pages: 520, rating: 4.7 },
      { title: 'Purification of the Heart', author: 'Hamza Yusuf', cover: 'https://picsum.photos/seed/book5/200/300', pages: 230, rating: 4.8 },
      { title: 'In the Footsteps of the Prophet', author: 'Tariq Ramadan', cover: 'https://picsum.photos/seed/book6/200/300', pages: 310, rating: 4.6 },
    ]);

    console.log('Seeding audiobooks...');
    await supabase.from('audiobooks').insert([
      { title: 'Lives of the Sahaba', narrator: 'Omar Suleiman', cover: 'https://picsum.photos/seed/audio1/200/200', duration: '12h 30m', rating: 4.9 },
      { title: 'Quran Translation', narrator: 'Mishary Rashid', cover: 'https://picsum.photos/seed/audio2/200/200', duration: '60h 15m', rating: 5.0 },
      { title: 'Seerah of the Prophet', narrator: 'Yasir Qadhi', cover: 'https://picsum.photos/seed/audio3/200/200', duration: '45h 00m', rating: 4.8 },
      { title: '40 Hadith Nawawi', narrator: 'Mufti Menk', cover: 'https://picsum.photos/seed/audio4/200/200', duration: '8h 45m', rating: 4.7 },
    ]);

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
