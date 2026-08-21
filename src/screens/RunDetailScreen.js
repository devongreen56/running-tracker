import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { fmtTime, fmtPace } from '../utils';
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable
        style={styles.mapWrap}
        disabled={path.length <= 1}
        onPress={() => navigation.navigate('MapFullScreen', { path })}
      >
        {path.length > 1 ? (
          <>
            <MapView style={styles.map} initialRegion={getRegion(path)} scrollEnabled={false} zoomEnabled={false} pointerEvents="none">
              <Polyline coordinates={path} strokeColor={colors.trail} strokeWidth={4} />
              <Marker coordinate={path[0]} pinColor="#2F6B4F" title="출발" />
              <Marker coordinate={path[path.length - 1]} pinColor="#C1543C" title="도착" />
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

        <View style={styles.grid}>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>거리</Text>
            <Text style={styles.cellValue}>{record.distance.toFixed(2)} km</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>시간</Text>
            <Text style={styles.cellValue}>{fmtTime(record.duration)}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>평균 페이스</Text>
            <Text style={styles.cellValue}>{fmtPace(record.avgPace)}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>소모 칼로리</Text>
            <Text style={styles.cellValue}>{Math.round(record.kcal)} kcal</Text>
          </View>
        </View>
      </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '47%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, alignItems: 'center' },
  cellLabel: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  cellValue: { fontSize: 18, fontWeight: '600', color: colors.ink },
});
