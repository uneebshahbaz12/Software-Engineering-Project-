import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES } from '../../src/constants/theme';
import { bookAPI } from '../../src/services/api';

const { width } = Dimensions.get('window');

export default function BookDetailScreen() {
  const params = useLocalSearchParams();
  const id = String(params.id || '');
  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState(null);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await bookAPI.getById(id);
        const found = res?.data || null;
        if (!alive) return;
        setBook(found || null);
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

  const pdfUrl = book?.pdf_url || book?.pdfUrl || '';

  // Use Google Docs Viewer to render PDFs from direct URLs (no bucket needed)
  const googleDocsViewerUrl = pdfUrl
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`
    : '';

  const handleOpenExternal = async () => {
    if (!pdfUrl) return;
    try {
      const ok = await Linking.canOpenURL(pdfUrl);
      if (!ok) return Alert.alert('Invalid URL', 'PDF URL is not accessible.');
      await Linking.openURL(pdfUrl);
    } catch {
      Alert.alert('Error', 'Could not open PDF externally.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{book?.title || 'Book'}</Text>
        {!!pdfUrl && (
          <TouchableOpacity onPress={handleOpenExternal} style={styles.externalIconBtn}>
            <Ionicons name="open-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
        {!pdfUrl && <View style={{ width: 34 }} />}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerText}>Loading...</Text>
        </View>
      ) : !book ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={24} color={COLORS.textMuted} />
          <Text style={styles.centerText}>Book not found.</Text>
        </View>
      ) : !pdfUrl ? (
        /* No PDF URL set — show book info */
        <View style={styles.body}>
          <Text style={styles.author}>{book.author}</Text>
          {!!book.description && <Text style={styles.desc}>{book.description}</Text>}
          <View style={styles.noPdfBox}>
            <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.noPdfText}>No PDF URL set for this book.</Text>
            <Text style={styles.noPdfSub}>Add a pdf_url in the Supabase books table to enable reading.</Text>
          </View>
        </View>
      ) : pdfError ? (
        /* PDF failed to render — show error + external open */
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={40} color={COLORS.textMuted} />
          <Text style={styles.errorTitle}>Could not render PDF in-app</Text>
          <Text style={styles.centerText}>The PDF viewer could not load this file.</Text>
          <TouchableOpacity style={styles.externalBtn} onPress={handleOpenExternal}>
            <Ionicons name="open-outline" size={16} color="#FFF" />
            <Text style={styles.externalBtnText}>Open PDF Externally</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setPdfError(false)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Auto-show PDF via WebView (Google Docs Viewer for direct URLs) */
        <View style={{ flex: 1 }}>
          {/* Compact book info bar */}
          {!!book.author && (
            <View style={styles.infoBar}>
              <Text style={styles.infoAuthor}>{book.author}</Text>
              {!!book.rating && (
                <View style={styles.infoRating}>
                  <Ionicons name="star" size={11} color={COLORS.gold} />
                  <Text style={styles.infoRatingText}>{book.rating}</Text>
                </View>
              )}
            </View>
          )}
          <WebView
            style={{ flex: 1, backgroundColor: COLORS.background }}
            source={{ uri: googleDocsViewerUrl }}
            startInLoadingState
            renderLoading={() => (
              <View style={[styles.center, StyleSheet.absoluteFill]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.centerText}>Loading PDF...</Text>
              </View>
            )}
            onError={() => setPdfError(true)}
            onHttpError={(e) => {
              if (e?.nativeEvent?.statusCode >= 400) setPdfError(true);
            }}
            // Block navigation away from the viewer
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url || '';
              // Allow google docs viewer and the PDF URL itself
              if (url.includes('docs.google.com') || url.includes('gview') || url === pdfUrl) return true;
              // Block everything else
              return false;
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  title: { flex: 1, marginHorizontal: 10, color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 20 },
  centerText: { color: COLORS.textSecondary, textAlign: 'center' },
  body: { padding: SIZES.spacing_base },
  author: { color: COLORS.primary, fontSize: SIZES.md, fontWeight: '700' },
  desc: { color: COLORS.textSecondary, marginTop: 10, lineHeight: 20 },
  noPdfBox: {
    marginTop: 30,
    alignItems: 'center',
    gap: 10,
    padding: 24,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: SIZES.radius_lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  noPdfText: { color: COLORS.textPrimary, fontSize: SIZES.md, fontWeight: '600' },
  noPdfSub: { color: COLORS.textMuted, fontSize: SIZES.sm, textAlign: 'center' },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing_base,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surfaceBorder,
  },
  infoAuthor: { color: COLORS.primary, fontSize: SIZES.sm, fontWeight: '600' },
  infoRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  infoRatingText: { color: COLORS.gold, fontSize: SIZES.xs, fontWeight: '600' },
  errorTitle: { color: COLORS.textPrimary, fontSize: SIZES.lg, fontWeight: '700', marginBottom: 4 },
  externalBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius_md,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  externalBtnText: { color: '#FFF', fontWeight: '800' },
  retryBtn: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryBtnText: { color: COLORS.primary, fontWeight: '600' },
});
