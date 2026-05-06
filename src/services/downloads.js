import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const DOWNLOADS_KEY = 'downloads:v1';
const DOWNLOADS_DIR = FileSystem.documentDirectory + 'downloads/';

async function ensureDir() {
  const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
  }
}

async function readIndex() {
  const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeIndex(items) {
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(items));
}

function safeFileName(input) {
  return String(input || '')
    .replace(/[^a-z0-9_\-\.]+/gi, '_')
    .slice(0, 80);
}

export async function listDownloads() {
  await ensureDir();
  const index = await readIndex();

  // Drop entries whose files were deleted (skip streamed:// entries).
  const filtered = [];
  for (const item of index) {
    if (item.isStreamed || (item.localUri || '').startsWith('streamed://')) {
      filtered.push(item);
      continue;
    }
    const info = await FileSystem.getInfoAsync(item.localUri || '');
    if (info.exists) filtered.push({ ...item, bytes: info.size || item.bytes || 0 });
  }
  if (filtered.length !== index.length) await writeIndex(filtered);
  return filtered;
}

export async function getDownloadByContentId(contentId) {
  const index = await readIndex();
  return index.find((d) => d.contentId === contentId) || null;
}

export async function removeDownload(contentId) {
  await ensureDir();
  const index = await readIndex();
  const existing = index.find((d) => d.contentId === contentId);
  if (existing?.localUri) {
    try { await FileSystem.deleteAsync(existing.localUri, { idempotent: true }); } catch {}
  }
  const next = index.filter((d) => d.contentId !== contentId);
  await writeIndex(next);
  return next;
}

export async function clearAllDownloads() {
  await ensureDir();
  const index = await readIndex();
  for (const item of index) {
    if (item?.localUri) {
      try { await FileSystem.deleteAsync(item.localUri, { idempotent: true }); } catch {}
    }
  }
  await writeIndex([]);
  return [];
}

/**
 * Downloads a direct media URL (mp4/HLS file URL).
 * YouTube is not supported for offline downloads.
 */
export async function downloadContent({ contentId, title, thumbnail, sourceUrl, onProgress }) {
  if (!contentId) throw new Error('contentId is required');
  if (!sourceUrl) throw new Error('sourceUrl is required');

  // Basic YouTube guard
  if (/youtube\.com|youtu\.be/i.test(sourceUrl)) {
    throw new Error('YouTube downloads are not supported. Use direct video URLs (mp4/HLS).');
  }

  await ensureDir();

  const extGuess = sourceUrl.includes('.m3u8') ? '.m3u8' : '.mp4';
  const fileName = `${safeFileName(contentId)}_${safeFileName(title)}${extGuess}`;
  const localUri = DOWNLOADS_DIR + fileName;

  const downloadResumable = FileSystem.createDownloadResumable(
    sourceUrl,
    localUri,
    {},
    (p) => {
      if (!onProgress) return;
      const total = p.totalBytesExpectedToWrite || 0;
      const written = p.totalBytesWritten || 0;
      const ratio = total > 0 ? written / total : 0;
      onProgress({ written, total, ratio });
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result?.uri) throw new Error('Download failed');

  const info = await FileSystem.getInfoAsync(result.uri);

  const index = await readIndex();
  const entry = {
    contentId,
    title: title || 'Untitled',
    thumbnail: thumbnail || '',
    sourceUrl,
    localUri: result.uri,
    downloadedAt: new Date().toISOString(),
    bytes: info.size || 0,
  };

  const next = [entry, ...index.filter((d) => d.contentId !== contentId)];
  await writeIndex(next);
  return entry;
}

