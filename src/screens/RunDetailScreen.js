import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable, Image, Modal } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { fmtTime, fmtPace } from '../utils';
import { getHistory } from '../storage';
import { colors } from '../theme';

export function getRegion(path) {
  if (!path || path.length === 0) {
    return { latitude: 37.5665, longitude: 126.978, latitudeDelta: 0.01, longitudeDelta: 0.01 };
  }
  const lats = path.map((p) => p.latitude);
  const lons = path.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max(0.005, (maxLat - minLat) * 1.4),
    longitudeDelta: Math.max(0.005, (maxLon - minLon) * 1.4),
  };
}

export default function RunDetailScreen({ route, navigation }) {
  const { record } = route.params;
  const date = new Date(record.date);
  const path = record.path || [];
  const photos = record.photos || [];

  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [neighbors, setNeighbors] = useState({ prev: null, next: null });

  // Figure out which record comes before/after this one in the "기록" list
  // (newest-first order, same as HistoryScreen) so the prev/next buttons work.
  useEffect(() => {
    (async () => {
      const history = await getHistory();
      const displayList = [...history].reverse(); // newest first
      const idx = displayList.findIndex((r) => r.date === record.date);
      if (idx === -1) {
        setNeighbors({ prev: null, next: null });
        return;
      }
      setNeighbors({
        prev: idx > 0 ? displayList[idx - 1] : null, // newer run
        next: idx < displayList.length - 1 ? displayList[idx + 1] : null, // older run
      });
    })();
  }, [record.date]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable
        style={styles.mapWrap}
        disabled={path.length <= 1}
        onPress={() => navigation.navigate('MapFullScreen', { path, photos })}
      >
        {path.length > 1 ? (
          <>
            <MapView style={styles.map} initialRegion={getRegion(path)} scrollEnabled={false} zoomEnabled={false} pointerEvents="none">
              <Polyline coordinates={path} strokeColor={colors.trail} strokeWidth={4} />
              <Marker coordinate={path[0]} pinColor="#2F6B4F" title="출발" />
              <Marker coordinate={path[path.length - 1]} pinColor="#C1543C" title="도착" />
              {photos.map((ph, i) => (
                <Marker key={`photo-${i}`} coordinate={{ latitude: ph.latitude, longitude: ph.longitude }}>
                  <View style={styles.photoMarker}>
                    <Image source={{ uri: ph.uri }} style={styles.photoThumbSmall} />
                  </View>
                </Marker>
              ))}
            </MapView>
            <View style={styles.expandHint}>
              <Text style={styles.expandHintText}>탭하면 전체화면으로 볼 수 있어요</Text>
            </View>
          </>
        ) : (
          <View style={[styles.map, styles.noMap]}>
            <Text style={styles.noMapText}>이 기록에는 저장된 경로가 없어요.</Text>
          </View>
        )}
      </Pressable>

      <View style={{ padding: 20 }}>
        <Text style={styles.date}>
          {date.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </Text>

        <View style={styles.statRow}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>거리</Text>
            <Text style={styles.statValue}>{record.distance.toFixed(2)}<Text style={styles.statUnit}>km</Text></Text>
          </View>
          <View style={[styles.statCell, styles.statDivider]}>
            <Text style={styles.statLabel}>시간</Text>
            <Text style={styles.statValue}>{fmtTime(record.duration)}</Text>
          </View>
          <View style={[styles.statCell, styles.statDivider]}>
            <Text style={styles.statLabel}>평균 페이스</Text>
            <Text style={styles.statValue}>{fmtPace(record.avgPace)}</Text>
          </View>
          <View style={[styles.statCell, styles.statDivider]}>
            <Text style={styles.statLabel}>칼로리</Text>
            <Text style={styles.statValue}>{Math.round(record.kcal)}<Text style={styles.statUnit}>kcal</Text></Text>
          </View>
        </View>

        {photos.length > 0 && (
          <>
            <Text style={styles.photoSectionTitle}>사진 {photos.length}장</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {photos.map((ph, i) => (
                <Pressable key={i} onPress={() => setPreviewPhoto(ph)}>
                  <Image source={{ uri: ph.uri }} style={styles.photoStripImage} />
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <View style={styles.navRow}>
          <Pressable
            style={[styles.navBtn, !neighbors.prev && styles.navBtnDisabled]}
            disabled={!neighbors.prev}
            onPress={() => navigation.setParams({ record: neighbors.prev })}
          >
            <Text style={[styles.navBtnText, !neighbors.prev && styles.navBtnTextDisabled]}>‹ 이전 기록</Text>
          </Pressable>
          <Pressable
            style={[styles.navBtn, !neighbors.next && styles.navBtnDisabled]}
            disabled={!neighbors.next}
            onPress={() => navigation.setParams({ record: neighbors.next })}
          >
            <Text style={[styles.navBtnText, !neighbors.next && styles.navBtnTextDisabled]}>다음 기록 ›</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={!!previewPhoto} transparent animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewPhoto(null)}>
          {previewPhoto && <Image source={{ uri: previewPhoto.uri }} style={styles.previewImage} resizeMode="contain" />}
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  mapWrap: { width: '100%', height: 280, position: 'relative' },
  expandHint: { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(28,43,34,0.75)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  expandHintText: { color: '#fff', fontSize: 11 },
  map: { width: Dimensions.get('window').width, height: 280 },
  noMap: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  noMapText: { color: colors.muted, fontSize: 13 },
  date: { fontSize: 12, color: colors.muted, marginBottom: 16 },
  statRow: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, overflow: 'hidden' },
  statCell: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.line },
  statLabel: { fontSize: 10, color: colors.muted, marginBottom: 3, textAlign: 'center' },
  statValue: { fontSize: 14, fontWeight: '600', color: colors.ink },
  statUnit: { fontSize: 10, fontWeight: '400', color: colors.muted },
  photoMarker: { borderWidth: 2, borderColor: '#fff', borderRadius: 6, overflow: 'hidden' },
  photoThumbSmall: { width: 28, height: 28 },
  photoSectionTitle: { fontSize: 13, fontWeight: '600', color: colors.ink, marginTop: 20 },
  photoStripImage: { width: 100, height: 100, borderRadius: 12, marginRight: 8 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  navBtn: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 13, alignItems: 'center' },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontWeight: '600', color: colors.ink, fontSize: 13 },
  navBtnTextDisabled: { color: colors.muted },
  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '80%' },
});
