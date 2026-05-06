import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES } from '../../src/constants/theme';
import { bookAPI } from '../../src/services/api';

const { width } = Dimensions.get('window');

export default function AudiobookScreen() {
  const params = useLocalSearchParams();
  const id = String(params.id || '');
  const [loading, setLoading] = useState(true);
  const [ab, setAb] = useState(null);
  const [audioFailed, setAudioFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const webViewRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await bookAPI.getAudiobookById(id);
        const found = res?.data || null;
        if (!alive) return;
        setAb(found || null);
      } catch (err) {
        if (!alive) return;
        Alert.alert('Error', err.message);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };
    if (id) load();
    return () => { alive = false; };
  }, [id]);

  const sourceUrl = ab?.source_url || ab?.sourceUrl || '';

  // Determine audio type from URL extension
  const getAudioType = (url) => {
    if (!url) return '';
    const lower = url.toLowerCase();
    if (lower.includes('.mp3')) return 'audio/mpeg';
    if (lower.includes('.ogg')) return 'audio/ogg';
    if (lower.includes('.wav')) return 'audio/wav';
    if (lower.includes('.m4a') || lower.includes('.aac')) return 'audio/mp4';
    if (lower.includes('.flac')) return 'audio/flac';
    if (lower.includes('.webm')) return 'audio/webm';
    return '';
  };

  const audioType = getAudioType(sourceUrl);
  const safeTitle = (ab?.title || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const safeNarrator = (ab?.narrator || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  const audioHtml = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            height: 100%; width: 100%;
            background: linear-gradient(135deg, #0a1628 0%, #1a0a2e 50%, #0a1628 100%);
            font-family: -apple-system, Roboto, 'Segoe UI', Arial, sans-serif;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .player {
            width: 90%;
            max-width: 380px;
            text-align: center;
            padding: 24px;
          }
          .icon-circle {
            width: 120px; height: 120px;
            border-radius: 60px;
            background: rgba(0, 200, 150, 0.15);
            border: 2px solid rgba(0, 200, 150, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 48px;
          }
          .title {
            font-size: 20px;
            font-weight: 800;
            margin-bottom: 6px;
            line-height: 1.3;
          }
          .narrator {
            font-size: 14px;
            color: rgba(255,255,255,0.6);
            margin-bottom: 24px;
          }
          audio {
            width: 100%;
            margin-bottom: 16px;
            border-radius: 8px;
          }
          .status {
            font-size: 13px;
            color: rgba(255,255,255,0.5);
            margin-top: 8px;
          }
          .error-msg {
            color: #FF6B8A;
            font-size: 14px;
            margin-top: 16px;
            padding: 12px;
            background: rgba(255, 107, 138, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(255, 107, 138, 0.2);
          }
          .time-info {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: rgba(255,255,255,0.4);
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="player">
          <div class="icon-circle">🎧</div>
          <div class="title">${safeTitle}</div>
          ${safeNarrator ? '<div class="narrator">Narrated by ' + safeNarrator + '</div>' : ''}
          <audio id="audioEl" controls autoplay preload="auto" crossorigin="anonymous">
            <source src="${sourceUrl}" ${audioType ? 'type="' + audioType + '"' : ''} />
            ${audioType !== 'audio/mpeg' ? '<source src="' + sourceUrl + '" type="audio/mpeg" />' : ''}
            Your browser does not support the audio element.
          </audio>
          <div class="time-info">
            <span id="currentTime">0:00</span>
            <span id="duration">--:--</span>
          </div>
          <div class="status" id="statusText">Loading audio...</div>
          <div class="error-msg" id="errorBox" style="display:none;"></div>
        </div>
        <script>
          (function() {
            var a = document.getElementById('audioEl');
            var status = document.getElementById('statusText');
            var errorBox = document.getElementById('errorBox');
            var currentTimeEl = document.getElementById('currentTime');
            var durationEl = document.getElementById('duration');
            var triedBlob = false;

            function post(obj) {
              try { window.ReactNativeWebView.postMessage(JSON.stringify(obj)); } catch(e) {}
            }

            function formatTime(s) {
              if (!s || isNaN(s)) return '--:--';
              var m = Math.floor(s / 60);
              var sec = Math.floor(s % 60);
              return m + ':' + (sec < 10 ? '0' : '') + sec;
            }

            // Fallback: fetch as blob and create object URL
            function tryBlobFallback() {
              if (triedBlob) return;
              triedBlob = true;
              status.textContent = 'Trying alternative loading...';
              fetch('${sourceUrl}')
                .then(function(r) { return r.blob(); })
                .then(function(blob) {
                  var url = URL.createObjectURL(blob);
                  a.src = url;
                  a.load();
                  a.play().catch(function() {
                    status.textContent = 'Tap play to start';
                  });
                })
                .catch(function(e) {
                  status.textContent = 'Error';
                  errorBox.style.display = 'block';
                  errorBox.textContent = 'Could not load audio. The URL may be invalid or inaccessible.';
                  post({ type: 'error', message: e.message || 'Blob fetch failed' });
                });
            }

            a.addEventListener('loadstart', function() {
              status.textContent = 'Loading audio...';
            });
            a.addEventListener('canplay', function() {
              status.textContent = 'Ready to play';
              durationEl.textContent = formatTime(a.duration);
              post({ type: 'ready' });
            });
            a.addEventListener('play', function() {
              status.textContent = 'Playing';
              post({ type: 'play' });
            });
            a.addEventListener('pause', function() {
              status.textContent = 'Paused';
              post({ type: 'pause' });
            });
            a.addEventListener('ended', function() {
              status.textContent = 'Finished';
              post({ type: 'ended' });
            });
            a.addEventListener('timeupdate', function() {
              currentTimeEl.textContent = formatTime(a.currentTime);
              if (a.duration) durationEl.textContent = formatTime(a.duration);
            });
            a.addEventListener('error', function(e) {
              var code = a.error ? a.error.code : 0;
              // Try blob fallback before giving up
              if (!triedBlob) {
                tryBlobFallback();
                return;
              }
              var msg = 'Audio failed to load.';
              if (code === 1) msg = 'Audio loading was aborted.';
              else if (code === 2) msg = 'Network error while loading audio.';
              else if (code === 3) msg = 'Audio format is not supported or file is corrupted.';
              else if (code === 4) msg = 'Audio source not found or URL is invalid.';
              status.textContent = 'Error';
              errorBox.style.display = 'block';
              errorBox.textContent = msg + ' Check that the source_url in Supabase is a valid, publicly accessible audio file.';
              post({ type: 'error', message: msg, code: code });
            });

            // Try to play after a short delay to work around autoplay restrictions
            setTimeout(function() {
              a.play().catch(function() {
                status.textContent = 'Tap play to start';
              });
            }, 500);
          })();
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <Text style={styles.title} numberOfLines={1}>{ab?.title || 'Audiobook'}</Text>
          {!!ab?.narrator && <Text style={styles.subtitle} numberOfLines={1}>Narrated by {ab.narrator}</Text>}
        </View>
        {!!sourceUrl && (
          <TouchableOpacity
            onPress={async () => {
              try {
                const ok = await Linking.canOpenURL(sourceUrl);
                if (!ok) return Alert.alert('Invalid URL', 'Audio URL is not accessible.');
                await Linking.openURL(sourceUrl);
              } catch { Alert.alert('Error', 'Could not open externally.'); }
            }}
            style={styles.externalIconBtn}
          >
            <Ionicons name="open-outline" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
        {!sourceUrl && <View style={{ width: 34 }} />}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerText}>Loading...</Text>
        </View>
      ) : !ab ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={24} color={COLORS.textMuted} />
          <Text style={styles.centerText}>Audiobook not found.</Text>
        </View>
      ) : !sourceUrl ? (
        <View style={styles.center}>
          <View style={styles.noUrlIcon}>
            <Ionicons name="musical-notes-outline" size={48} color={COLORS.textMuted} />
          </View>
          <Text style={styles.noUrlTitle}>No audio source set</Text>
          <Text style={styles.centerText}>
            Add a source_url to this audiobook in the Supabase audiobooks table to enable playback.
          </Text>
        </View>
      ) : audioFailed ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={40} color={COLORS.textMuted} />
          <Text style={styles.noUrlTitle}>Could not stream audio</Text>
          <Text style={styles.centerText}>The audio file could not be loaded in-app.</Text>
          <TouchableOpacity
            style={styles.openExternal}
            onPress={async () => {
              const ok = await Linking.canOpenURL(sourceUrl);
              if (!ok) return Alert.alert('Invalid URL', 'Audio URL is not accessible.');
              await Linking.openURL(sourceUrl);
            }}
          >
            <Ionicons name="open-outline" size={16} color="#FFF" />
            <Text style={styles.openExternalText}>Open in External Player</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setAudioFailed(false)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          style={{ flex: 1, backgroundColor: '#0a1628' }}
          originWhitelist={['*']}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          onError={() => setAudioFailed(true)}
          onHttpError={(e) => {
            if (e?.nativeEvent?.statusCode >= 400) setAudioFailed(true);
          }}
          mixedContentMode="always"
          onMessage={(event) => {
            try {
              const payload = JSON.parse(event.nativeEvent.data || '{}');
              if (payload.type === 'error') {
                setAudioFailed(true);
              } else if (payload.type === 'play') {
                setIsPlaying(true);
              } else if (payload.type === 'pause' || payload.type === 'ended') {
                setIsPlaying(false);
              }
            } catch {}
          }}
          // Block all external navigation — keep audio playing in-app
          onShouldStartLoadWithRequest={(request) => {
            if (request.url === 'about:blank') return true;
            if (request.isTopFrame !== false) return true;
            return false;
          }}
          source={{ html: audioHtml }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing_base,
    paddingVertical: SIZES.spacing_md,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  externalIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '800' },
  subtitle: { color: COLORS.textMuted, fontSize: SIZES.xs, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 20 },
  centerText: { color: COLORS.textSecondary, textAlign: 'center', maxWidth: 280 },
  noUrlIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  noUrlTitle: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700' },
  openExternal: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: SIZES.radius_md,
  },
  openExternalText: { color: '#fff', fontWeight: '800' },
  retryBtn: { marginTop: 10, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: COLORS.primary, fontWeight: '600' },
});
