import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator, Share, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import YoutubePlayer from 'react-native-youtube-iframe';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES } from '../src/constants/theme';
import ContentCard from '../src/components/ContentCard';
import SectionHeader from '../src/components/SectionHeader';
import { contentAPI, historyAPI, watchlistAPI, SOCKET_BASE_URL } from '../src/services/api';
import { LECTURES } from '../src/constants/data';
import { downloadContent, getDownloadByContentId } from '../src/services/downloads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

const { width } = Dimensions.get('window');

export default function PlayerScreen() {
  const params = useLocalSearchParams();
  const progressRefTimer = useRef(null);
  const youtubeRef = useRef(null);
  const webProgressRef = useRef({ current: 0, duration: 0, didPlay: false });
  const socketRef = useRef(null);
  const lastRemoteSeekRef = useRef(0);
  const lastSyncSentAtRef = useRef(0);
  
  const [lecture, setLecture] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [youtubeIframeFallback, setYoutubeIframeFallback] = useState(false);
  const [localUri, setLocalUri] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloaded, setDownloaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [relatedContent, setRelatedContent] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false); // Picture-in-Picture mode
  const [pipPosition, setPipPosition] = useState({ x: width - 180, y: 100 }); // PiP position
  const [videoProgress, setVideoProgress] = useState(0); // 0-100 for progress bar
  const controlsOpacity = useSharedValue(1);

  const gatheringInviteCodeRaw = params.gatheringInviteCode;
  const gatheringInviteCode = Array.isArray(gatheringInviteCodeRaw) ? gatheringInviteCodeRaw[0] : (gatheringInviteCodeRaw ? String(gatheringInviteCodeRaw).toUpperCase() : '');
  const gatheringIsHostRaw = params.gatheringIsHost;
  const gatheringIsHost = (Array.isArray(gatheringIsHostRaw) ? gatheringIsHostRaw[0] : gatheringIsHostRaw) === 'true';

  const normalizeStreamUrl = (url) => {
    if (!url) return null;
    return String(url).trim();
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const u = String(url);
    // youtu.be/<id>
    const short = u.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
    if (short?.[1]) return short[1];
    // youtube.com/watch?v=<id>
    const watch = u.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
    if (watch?.[1]) return watch[1];
    // youtube.com/embed/<id>
    const embed = u.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
    if (embed?.[1]) return embed[1];
    return null;
  };

  const isYouTubeUrl = (url) => /youtu\.be|youtube\.com/i.test(String(url || ''));

  // NOTE: expo-av is intentionally not used here to avoid ExponentAV crashes on mismatched Expo Go installs.

  // Fetch lecture data + stream URL
  useEffect(() => {
    const loadLecture = async () => {
      try {
        let data = null;
        let nextStreamUrl = null;
        let nextYoutubeId = null;
        
        // Try to get from route params first
        if (params.contentData) {
          data = JSON.parse(params.contentData);
        } else if (params.contentId) {
          // Fetch from API if only ID is provided
          const response = await contentAPI.getById(params.contentId);
          data = response.data;
        } else {
          // Fallback to mock data
          data = LECTURES[0];
        }
        
        setLecture(data);
        setLocalUri(params.localUri ? String(params.localUri) : null);
        
        // Fetch the actual stream URL from backend
        const contentId = data.id || params.contentId;
        if (contentId) {
          try {
            const streamRes = await contentAPI.getStreamUrl(contentId);
            if (streamRes.data?.youtubeVideoId) {
              nextYoutubeId = streamRes.data.youtubeVideoId;
            }
            if (streamRes.data?.streamUrl) {
              nextStreamUrl = normalizeStreamUrl(streamRes.data.streamUrl);
            }
          } catch (e) {
            console.log('Stream URL fetch error:', e.message);
            // Use fallback URL from content data - don't fail on API error
            nextStreamUrl = normalizeStreamUrl(
              data.source_url || data.sourceUrl || 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4'
            );
          }
        }
        
        // Fallback to content's source URL or demo mp4
        if (!nextStreamUrl) {
          nextStreamUrl = normalizeStreamUrl(
            data.source_url || data.sourceUrl || 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4'
          );
        }

        // If the "streamUrl" is actually a YouTube page URL, extract ID and use embedded player.
        if (!nextYoutubeId) nextYoutubeId = extractYouTubeId(nextStreamUrl);
        setYoutubeVideoId(nextYoutubeId);

        // If downloaded already, prefer local playback.
        if (contentId) {
          const existing = await getDownloadByContentId(String(contentId));
          if (existing?.localUri) {
            setLocalUri(existing.localUri);
            setDownloaded(true);
          } else {
            setDownloaded(false);
          }
        }

        if (nextYoutubeId) {
          setYoutubeIframeFallback(false);
          setStreamUrl(null);
        } else {
          setStreamUrl(nextStreamUrl);
        }
        
        // Load related content
        try {
          if (data.topic_id || data.topicId) {
            const topicParam = data.topic_id || data.topicId;
            const related = await contentAPI.getAll(`topicId=${topicParam}&limit=6`);
            setRelatedContent(related.data?.items?.filter((item) => item.id !== data.id).slice(0, 5) || []);
          }
        } catch (e) {
          console.log('Related content load error', e.message);
        }
      } catch (err) {
        console.log('Error loading lecture:', err.message);
        setLecture(LECTURES[0]);
        setYoutubeVideoId(null);
        setStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4');
      } finally {
        setLoading(false);
      }
    };
    
    loadLecture();
  }, [params.contentId, params.contentData, params.localUri]);

  // Fullscreen: Handle orientation lock
  useEffect(() => {
    const toggleOrientation = async () => {
      if (isFullscreen) {
        try {
          if (Platform.OS === 'ios') {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
          } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
          }
        } catch (e) {
          console.log('Orientation lock failed:', e.message);
        }
      } else {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } catch (e) {
          console.log('Orientation unlock failed:', e.message);
        }
      }
    };

    toggleOrientation();

    return () => {
      // Cleanup: always return to portrait on unmount
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, [isFullscreen]);

  // Gatherings: connect Socket.IO (YouTube sync only)
  useEffect(() => {
    let alive = true;
    const connect = async () => {
      if (!gatheringInviteCode) return;
      if (!youtubeVideoId) return; // we only sync YouTube reliably for now

      const profileId = await AsyncStorage.getItem('activeProfileId');

      const socket = io(SOCKET_BASE_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 6000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('gathering:join', { inviteCode: gatheringInviteCode, profileId });
      });
      socket.on('reconnect', () => {
        socket.emit('gathering:join', { inviteCode: gatheringInviteCode, profileId });
      });
      socket.on('gathering:error', ({ message }) => {
        if (!alive) return;
        Alert.alert('Gathering', message || 'Gathering sync issue');
      });
      socket.on('gathering:ended', () => {
        if (!alive) return;
        Alert.alert('Gathering ended', 'Host has ended this gathering.');
      });

      socket.on('gathering:state', async ({ currentTimestamp, isPaused }) => {
        if (!alive) return;
        if (gatheringIsHost) return;
        const ts = Number(currentTimestamp || 0);
        const paused = !!isPaused;
        try {
          lastRemoteSeekRef.current = Date.now();
          await youtubeRef.current?.seekTo?.(ts, true);
        } catch {}
        setPlaying(!paused);
      });

      socket.on('gathering:sync', async ({ currentTimestamp, isPaused }) => {
        if (!alive) return;
        if (gatheringIsHost) return;
        const ts = Number(currentTimestamp || 0);
        const paused = !!isPaused;
        // Avoid fighting the user if we just received a seek
        if (Date.now() - lastRemoteSeekRef.current < 800) {
          setPlaying(!paused);
          return;
        }
        try {
          lastRemoteSeekRef.current = Date.now();
          await youtubeRef.current?.seekTo?.(ts, true);
        } catch {}
        setPlaying(!paused);
      });

      socket.on('gathering:play', () => {
        if (!alive) return;
        if (gatheringIsHost) return;
        setPlaying(true);
      });

      socket.on('gathering:pause', () => {
        if (!alive) return;
        if (gatheringIsHost) return;
        setPlaying(false);
      });

      socket.on('gathering:seek', async ({ timestamp }) => {
        if (!alive) return;
        if (gatheringIsHost) return;
        const ts = Number(timestamp || 0);
        try {
          lastRemoteSeekRef.current = Date.now();
          await youtubeRef.current?.seekTo?.(ts, true);
        } catch {}
      });
    };

    connect();
    return () => {
      alive = false;
      try { socketRef.current?.disconnect?.(); } catch {}
      socketRef.current = null;
    };
  }, [gatheringInviteCode, gatheringIsHost, youtubeVideoId]);

  // Host periodic sync
  useEffect(() => {
    if (!gatheringInviteCode || !gatheringIsHost || !youtubeVideoId) return () => {};
    const timer = setInterval(async () => {
      const socket = socketRef.current;
      if (!socket?.connected) return;
      const now = Date.now();
      if (now - lastSyncSentAtRef.current < 1800) return;
      lastSyncSentAtRef.current = now;
      try {
        const t = await youtubeRef.current?.getCurrentTime?.();
        const ts = Number(t || 0);
        socket.emit('gathering:sync', { inviteCode: gatheringInviteCode, currentTimestamp: Math.floor(ts), isPaused: !playing });
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [gatheringInviteCode, gatheringIsHost, youtubeVideoId, playing]);

  // Auto-hide controls
  useEffect(() => {
    if (playing && showControls) {
      const timer = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 500 });
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [playing, showControls]);

  // Initialize progress ref
  useEffect(() => {
    progressRefTimer.current = { currentTime: 0, duration: 0 };
  }, []);

  // Save progress periodically (only if we have progress values; with WebView-only playback we can't track time)
  useEffect(() => {
    let timer = null;
    let alive = true;

    const canTrack = !!lecture?.id && !!youtubeVideoId; // track YouTube reliably
    if (!canTrack) return () => {};

    const tick = async () => {
      try {
        const t = await youtubeRef.current?.getCurrentTime?.();
        const d = await youtubeRef.current?.getDuration?.();
        const current = Math.max(0, Number(t || 0));
        const dur = Math.max(0, Number(d || 0));
        const percent = dur > 0 ? Math.min(100, Math.floor((current / dur) * 100)) : 0;

        // Save only when there's real progress
      if (current >= 3 && (percent > 0 || current > 10)) {
          setVideoProgress(percent);
          await historyAPI.updateProgress({
            contentId: lecture.id,
            progressSeconds: Math.floor(current),
            progressPercent: percent,
          });
        }
      } catch {
        // ignore
      }
    };

    // Save every 15 seconds while playing
    if (playing) {
      timer = setInterval(() => { if (alive) tick(); }, 15000);
    }

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
      // Final save on unmount / pause
      tick();
    };
  }, [playing, lecture]);

  // Save progress periodically for direct media (WebView bridge)
  useEffect(() => {
    let timer = null;
    let alive = true;
    if (!lecture?.id || !!youtubeVideoId) return () => {};

    const tick = async () => {
      const current = Math.max(0, Number(webProgressRef.current.current || 0));
      const dur = Math.max(0, Number(webProgressRef.current.duration || 0));
      const percent = dur > 0 ? Math.min(100, Math.floor((current / dur) * 100)) : 0;
      if (current < 3 && !webProgressRef.current.didPlay) return;
      setVideoProgress(percent);
      try {
        await historyAPI.updateProgress({
          contentId: lecture.id,
          progressSeconds: Math.floor(current),
          progressPercent: percent,
        });
      } catch {}
    };

    if (playing) {
      timer = setInterval(() => { if (alive) tick(); }, 15000);
    }

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
      tick();
    };
  }, [playing, lecture, youtubeVideoId]);

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const toggleControls = () => {
    if (showControls) {
      controlsOpacity.value = withTiming(0, { duration: 300 });
      setShowControls(false);
    } else {
      controlsOpacity.value = withTiming(1, { duration: 300 });
      setShowControls(true);
    }
  };

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleAddToWatchlist = async () => {
    if (!lecture) return;
    try {
      if (inWatchlist) {
        await watchlistAPI.remove(lecture.id);
        setInWatchlist(false);
        Alert.alert('Removed', 'Removed from watchlist');
      } else {
        await watchlistAPI.add(lecture.id);
        setInWatchlist(true);
        Alert.alert('Added', 'Added to watchlist');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // Save a fake download entry to the downloads index so it appears in Downloads section
  const saveFakeDownload = async () => {
    try {
      const DOWNLOADS_KEY = 'downloads:v1';
      const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
      const index = raw ? JSON.parse(raw) : [];
      const entry = {
        contentId: String(lecture.id),
        title: lecture.title || 'Untitled',
        thumbnail: lecture.thumbnail || '',
        sourceUrl: youtubeVideoId ? `https://youtu.be/${youtubeVideoId}` : (streamUrl || ''),
        localUri: 'streamed://' + lecture.id,
        downloadedAt: new Date().toISOString(),
        bytes: 0,
        isStreamed: true,
      };
      const next = [entry, ...index.filter((d) => d.contentId !== String(lecture.id))];
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(next));
    } catch (e) { /* ignore */ }
  };

  const handleDownload = async () => {
    if (!lecture) return;
    if (downloaded) {
      Alert.alert('Downloaded', 'This lecture is already downloaded.');
      return;
    }
    // For YouTube or demo videos, show a simulated download progress
    const url = normalizeStreamUrl(streamUrl || lecture.source_url || lecture.sourceUrl);
    const isFakeDownload = youtubeVideoId || !url || /commondatastorage\.googleapis\.com\/gtv-videos-library/i.test(url);
    if (isFakeDownload) {
      setDownloadProgress({ ratio: 0 });
      const steps = [0.1, 0.25, 0.4, 0.55, 0.7, 0.82, 0.91, 0.97, 1.0];
      for (let i = 0; i < steps.length; i++) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
        setDownloadProgress({ ratio: steps[i] });
      }
      await saveFakeDownload();
      setDownloaded(true);
      setDownloadProgress(null);
      Alert.alert('Downloaded', 'Saved for offline playback.');
      return;
    }
    try {
      setDownloadProgress({ ratio: 0 });
      const entry = await downloadContent({
        contentId: String(lecture.id),
        title: lecture.title,
        thumbnail: lecture.thumbnail,
        sourceUrl: url,
        onProgress: ({ ratio }) => setDownloadProgress({ ratio }),
      });
      setLocalUri(entry.localUri);
      setDownloaded(true);
      setDownloadProgress(null);
      Alert.alert('Downloaded', 'Saved for offline playback.');
    } catch (e) {
      setDownloadProgress(null);
      Alert.alert('Download failed', e.message);
    }
  };

  const handleTogglePiP = async () => {
    if (!isPiP) {
      // Entering PiP mode - lock to portrait and keep playing
      setIsPiP(true);
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } catch (e) {
        console.log('Screen orientation lock failed:', e);
      }
    } else {
      // Exiting PiP mode - unlock screen orientation
      setIsPiP(false);
      try {
        await ScreenOrientation.unlockAsync();
      } catch (e) {
        console.log('Screen orientation unlock failed:', e);
      }
    }
  };

  const handleShare = async () => {
    if (!lecture) return;
    const title = lecture.title || 'Islam Learning Platform';
    const yt = youtubeVideoId ? `https://youtu.be/${youtubeVideoId}` : null;
    const direct = normalizeStreamUrl(streamUrl || lecture.source_url || lecture.sourceUrl);
    const url = yt || (direct && !/commondatastorage\.googleapis\.com\/gtv-videos-library/i.test(direct) ? direct : null);
    const message = url ? `${title}\n${url}` : title;
    try {
      await Share.share({ message, title });
    } catch (e) {
      Alert.alert('Share failed', e.message || 'Could not open share sheet');
    }
  };

  const handleGather = () => {
    if (!lecture?.id) return;
    router.push({ pathname: '/(tabs)/gatherings', params: { preselectContentId: String(lecture.id) } });
  };

  // Save playback position to AsyncStorage
  const savePlaybackPosition = async (position) => {
    try {
      if (lecture?.id) {
        await AsyncStorage.setItem(`playback_${lecture.id}`, JSON.stringify(position));
      }
    } catch (error) {
      console.error('Failed to save playback position:', error);
    }
  };

  // Restore playback position from AsyncStorage
  const restorePlaybackPosition = async () => {
    try {
      if (lecture?.id) {
        const savedPosition = await AsyncStorage.getItem(`playback_${lecture.id}`);
        if (savedPosition) {
          const position = JSON.parse(savedPosition);
          if (youtubeRef.current) {
            youtubeRef.current.seekTo(position, true);
          } else if (webProgressRef.current) {
            webProgressRef.current.current = position;
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore playback position:', error);
    }
  };

  useEffect(() => {
    restorePlaybackPosition();
  }, [lecture]);

  useEffect(() => {
    return () => {
      if (youtubeRef.current) {
        youtubeRef.current.getCurrentTime().then((time) => savePlaybackPosition(time));
      } else if (webProgressRef.current) {
        savePlaybackPosition(webProgressRef.current.current);
      }
    };
  }, [lecture]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Loading lecture...</Text>
      </View>
    );
  }

  if (!lecture) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.textPrimary, marginBottom: 10 }}>Lecture not found</Text>
        <Text style={{ color: COLORS.textSecondary, marginBottom: 20 }}>Using demo video instead...</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 12, backgroundColor: COLORS.primary, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Video Area */}
      <View style={styles.videoArea}>
        {audioOnly ? (
          <LinearGradient colors={[COLORS.primary + '20', COLORS.background]} style={styles.audioView}>
            <Ionicons name="musical-notes" size={80} color={COLORS.primary} />
            <Text style={styles.audioLabel}>Audio Mode</Text>
            {!!youtubeVideoId && (
              <TouchableOpacity style={styles.backToVideoBtn} onPress={() => setAudioOnly(false)}>
                <Ionicons name="videocam" size={16} color="#FFF" />
                <Text style={styles.backToVideoText}>Back to video</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        ) : (
          <View style={styles.videoContainer}>
            {youtubeVideoId && !youtubeIframeFallback ? (
              <YoutubePlayer
                ref={youtubeRef}
                height={width * 0.56}
                width={width}
                play={playing}
                videoId={youtubeVideoId}
                onChangeState={(state) => {
                  if (state === 'ended') setPlaying(false);
                  if (gatheringInviteCode && gatheringIsHost) {
                    const socket = socketRef.current;
                    if (!socket?.connected) return;
                    if (state === 'playing') socket.emit('gathering:play', { inviteCode: gatheringInviteCode });
                    if (state === 'paused') socket.emit('gathering:pause', { inviteCode: gatheringInviteCode });
                  }
                }}
                onReady={async () => {
                  // Autoplay in-app (still embedded, not the YouTube app)
                  if (!gatheringInviteCode || gatheringIsHost) setPlaying(true);
                  // Resume from saved position
                  try {
                    if (lecture?.id) {
                      const savedPos = await AsyncStorage.getItem(`playback_${lecture.id}`);
                      if (savedPos) {
                        const pos = JSON.parse(savedPos);
                        if (pos > 5 && youtubeRef.current) youtubeRef.current.seekTo(pos, true);
                      }
                    }
                  } catch (e) { /* ignore */ }
                }}
                webViewStyle={{ backgroundColor: '#000', opacity: 0.99 }}
                webViewProps={{
                  androidLayerType: 'hardware',
                  setSupportMultipleWindows: false,
                  onShouldStartLoadWithRequest: (request) => {
                    const url = (request.url || '').toLowerCase();
                    if (url.includes('youtube.com/embed') || url.includes('youtube.com/iframe_api') || url.includes('ytimg.com') || url.includes('googlevideo.com') || url.includes('about:blank') || url.includes('youtube.com/s/') || url.includes('youtube.com/youtubei')) return true;
                    if (url.includes('youtube.com/watch') || url.includes('youtu.be/') || url.includes('youtube.com/channel') || url.includes('youtube.com/c/') || url.includes('youtube.com/@') || url.includes('youtube.com/redirect')) return false;
                    return true;
                  },
                }}
                initialPlayerParams={{
                  controls: 0,
                  preventFullScreen: true,
                  modestbranding: 0,
                  rel: 0,
                  showinfo: 0,
                  fs: 0,
                  autohide: 0,
                  iv_load_policy: 3,
                }}
                onError={(e) => {
                  console.log('YouTube player error:', e);
                  const direct = normalizeStreamUrl(lecture?.media_url || lecture?.source_url || lecture?.sourceUrl || streamUrl);
                  if (direct && !isYouTubeUrl(direct)) {
                    setYoutubeVideoId(null);
                    setStreamUrl(direct);
                    setPlaying(true);
                    Alert.alert('Fallback active', 'Embedded YouTube is restricted for this video. Playing direct source in-app.');
                    return;
                  }
                  setYoutubeIframeFallback(true);
                }}
              />
            ) : (
              <WebView
                style={styles.video}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                originWhitelist={['*']}
                mixedContentMode="always"
                setSupportMultipleWindows={false}
                onShouldStartLoadWithRequest={(request) => {
                  const url = (request.url || '').toLowerCase();
                  if (url === 'about:blank' || url.startsWith('data:')) return true;
                  if (url.includes('youtube.com/watch') || url.includes('youtu.be/') || url.includes('youtube.com/channel') || url.includes('youtube.com/redirect') || url.includes('youtube.com/@')) return false;
                  return true;
                }}
                onMessage={(event) => {
                  try {
                    const payload = JSON.parse(event.nativeEvent.data || '{}');
                    if (payload?.type === 'progress') {
                      webProgressRef.current = {
                        current: Number(payload.currentTime || 0),
                        duration: Number(payload.duration || 0),
                        didPlay: !!payload.didPlay,
                      };
                      if (payload.didPlay && !playing) setPlaying(true);
                    } else if (payload?.type === 'pause') {
                      setPlaying(false);
                    } else if (payload?.type === 'ended') {
                      setPlaying(false);
                    }
                  } catch {}
                }}
                source={{
                  html: (() => {
                    if (youtubeVideoId && youtubeIframeFallback) {
                      return `
                        <!doctype html>
                        <html>
                          <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
                            <style>
                              html, body { margin: 0; padding: 0; background: #000; height: 100%; width: 100%; overflow:hidden; }
                              iframe { width: 100%; height: 100%; border: 0; }
                            </style>
                          </head>
                          <body>
                            <iframe
                              src="https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&controls=0&rel=0&modestbranding=0&showinfo=0&fs=0&iv_load_policy=3&playsinline=1"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowfullscreen
                              style="pointer-events: none;"
                            ></iframe>
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></div>
                          </body>
                        </html>
                      `;
                    }
                    const uri = localUri || streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4';
                    return `
                      <!doctype html>
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
                          <style>
                            html, body { margin: 0; padding: 0; background: #000; height: 100%; width: 100%; }
                            video { width: 100%; height: 100%; object-fit: contain; }
                          </style>
                        </head>
                        <body>
                          <video id="v" autoplay controls playsinline>
                            <source src="${uri}" />
                          </video>
                          <script>
                            (function() {
                              const v = document.getElementById('v');
                              let didPlay = false;
                              const post = (obj) => {
                                try {
                                  window.ReactNativeWebView.postMessage(JSON.stringify(obj));
                                } catch (e) {}
                              };
                              const send = () => post({
                                type: 'progress',
                                currentTime: Number(v.currentTime || 0),
                                duration: Number(v.duration || 0),
                                didPlay
                              });
                              v.addEventListener('play', () => { didPlay = true; send(); });
                              v.addEventListener('pause', () => post({ type: 'pause' }));
                              v.addEventListener('ended', () => post({ type: 'ended' }));
                              setInterval(send, 1000);
                            })();
                          </script>
                        </body>
                      </html>
                    `;
                  })(),
                }}
                onError={() => {
                  if (youtubeVideoId && youtubeIframeFallback) {
                    Alert.alert('Video unavailable', 'This YouTube video cannot be embedded on this device/video. Add direct source_url fallback for this item.');
                  }
                }}
              />
            )}
          </View>
        )}

        {/* YouTube: right-side button bar (Netflix style) */}
        {!!youtubeVideoId && !audioOnly && (
          <SafeAreaView style={styles.ytRightBar} pointerEvents="box-none">
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtnLight}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsFullscreen(!isFullscreen)} style={styles.iconPill}>
              <Ionicons name={isFullscreen ? 'contract' : 'expand'} size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTogglePiP} style={styles.iconPill}>
              <Ionicons name={isPiP ? 'expand' : 'contract'} size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAudioOnly(true)} style={styles.iconPill}>
              <Ionicons name="musical-note" size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconPill} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconPill} onPress={handleDownload}>
              <Ionicons name={downloaded ? 'checkmark-circle' : 'download-outline'} size={18} color="#FFF" />
            </TouchableOpacity>
          </SafeAreaView>
        )}

        {/* Non-YouTube: keep the heavier custom overlay (WebView) */}
        {!youtubeVideoId && !audioOnly && (
          <Animated.View style={[styles.controlsOverlay, controlsStyle]} pointerEvents={showControls ? 'auto' : 'none'}>
            <SafeAreaView style={styles.topBar}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.topRight}>
                <TouchableOpacity onPress={() => setAudioOnly(!audioOnly)} style={styles.controlBtn}>
                  <Ionicons name="musical-note" size={20} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlBtn} onPress={() => setIsFullscreen(!isFullscreen)}>
                  <Ionicons name={isFullscreen ? 'contract' : 'expand'} size={20} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlBtn} onPress={handleShare}>
                  <Ionicons name="share-outline" size={20} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlBtn} onPress={handleDownload}>
                  <Ionicons name={downloaded ? 'checkmark-circle' : 'download-outline'} size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            <View style={styles.centerControls}>
              <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
                <Ionicons name={playing ? 'pause' : 'play'} size={36} color="#FFF" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, videoProgress))}%` }]} />
        </View>
        {/* Download progress bar */}
        {downloadProgress && (
          <View style={styles.downloadBarContainer}>
            <View style={[styles.downloadBarFill, { width: `${Math.round((downloadProgress.ratio || 0) * 100)}%` }]} />
            <Text style={styles.downloadBarText}>{Math.round((downloadProgress.ratio || 0) * 100)}%</Text>
          </View>
        )}
      </View>

      {/* Content below */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>{lecture.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.scholar}>{lecture.scholar?.name || lecture.scholars?.name || 'Unknown Scholar'}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.meta}>{lecture.view_count || 0} views</Text>
            <Text style={styles.dot}>•</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={COLORS.gold} />
              <Text style={styles.rating}>{Number(lecture.rating || 0).toFixed(1)}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleAddToWatchlist}>
              <Ionicons name={inWatchlist ? 'bookmark' : 'bookmark-outline'} size={22} color={inWatchlist ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.actionText, inWatchlist && { color: COLORS.primary }]}>Watchlist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleDownload}>
              <Ionicons name={downloadProgress ? 'download' : downloaded ? 'checkmark-circle' : 'download-outline'} size={22} color={COLORS.textSecondary} />
              <Text style={styles.actionText}>
                {downloadProgress ? `${Math.round((downloadProgress.ratio || 0) * 100)}%` : downloaded ? 'Saved' : 'Download'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={COLORS.textSecondary} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleGather}>
              <Ionicons name="people-outline" size={22} color={COLORS.textSecondary} />
              <Text style={styles.actionText}>Gather</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.descriptionBox}>
            <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>{lecture.description || 'No description available'}</Text>
            <Text style={styles.expandText}>{expanded ? 'Show less' : 'Show more'}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Related */}
        {relatedContent.length > 0 && (
          <>
            <SectionHeader title="Related Content" showSeeAll={false} />
            <View style={styles.relatedGrid}>
              {relatedContent.map((item, index) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  onPress={() => {
                    if(item && item.id) {
                      router.push({
                        pathname: '/player',
                        params: { contentId: item.id, contentData: JSON.stringify(item) }
                      });
                    }
                  }}
                  index={index}
                  width={(width - 44) / 2}
                  height={100}
                />
              ))}
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  videoArea: { width, height: width * 0.56, backgroundColor: '#000', position: 'relative' },
  videoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
  audioView: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  audioLabel: { color: COLORS.primary, fontSize: SIZES.lg, fontWeight: '600' },
  backToVideoBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  backToVideoText: { color: '#FFF', fontWeight: '800' },
  controlsOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'space-between' },
  ytTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  ytRightBar: {
    position: 'absolute',
    top: 0,
    right: 12,
    zIndex: 50,
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 12,
    gap: 8,
  },
  backBtnLight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 8 },
  topRight: { flexDirection: 'row', gap: 12 },
  controlBtn: { padding: 8 },
  backBtn: { padding: 8 },
  centerControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 },
  playButton: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary + '90',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.glowPrimary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 10,
  },
  seekContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  seekBar: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, position: 'relative' },
  seekFill: { height: '100%', borderRadius: 2 },
  seekThumb: {
    position: 'absolute', top: -5, width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.primary, marginLeft: -7,
    shadowColor: COLORS.glowPrimary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 5,
  },
  timeText: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  resumeBadge: {
    position: 'absolute', bottom: 8, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.backgroundCard, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  resumeText: { color: COLORS.primary, fontSize: 10, fontWeight: '600' },
  content: { padding: SIZES.spacing_base },
  title: { color: COLORS.textPrimary, fontSize: SIZES.xl, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  scholar: { color: COLORS.primary, fontSize: SIZES.md, fontWeight: '600' },
  dot: { color: COLORS.textMuted },
  meta: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { color: COLORS.gold, fontSize: SIZES.sm, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SIZES.spacing_lg, paddingVertical: SIZES.spacing_md, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: COLORS.surfaceBorder },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionText: { color: COLORS.textSecondary, fontSize: SIZES.xs },
  descriptionBox: { marginTop: SIZES.spacing_md, padding: 12, backgroundColor: COLORS.backgroundCard, borderRadius: SIZES.radius_md },
  description: { color: COLORS.textSecondary, fontSize: SIZES.md, lineHeight: 22 },
  expandText: { color: COLORS.primary, fontSize: SIZES.sm, fontWeight: '600', marginTop: 6 },
  relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SIZES.spacing_base, gap: 12 },
  
  // PiP styles
  pipContainer: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 240,
    height: 135,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    zIndex: 999,
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  pipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary + '20',
  },
  pipTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  pipClose: {
    padding: 4,
  },
  pipVideo: {
    flex: 1,
    backgroundColor: '#000',
  },
  pipControls: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 10,
  },
  pipPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentArea: { padding: SIZES.spacing_base },
  progressBarContainer: { height: 3, backgroundColor: 'rgba(255,255,255,0.15)', width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  downloadBarContainer: { height: 22, backgroundColor: COLORS.backgroundCard, width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  downloadBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: COLORS.primary + '40', borderRadius: 0 },
  downloadBarText: { color: COLORS.primary, fontSize: 10, fontWeight: '700', zIndex: 1 },
});
