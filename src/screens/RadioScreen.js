import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { getStations, addStation, deleteStation } from '../storage';
import { colors } from '../theme';

export default function RadioScreen() {
  const [stations, setStations] = useState([]);
  const [current, setCurrent] = useState(null); // { name, url }
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const player = useAudioPlayer(current ? current.url : null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    (async () => {
      setStations(await getStations());
      // Let audio keep playing even if the phone's silent switch is on,
      // and continue while the app is backgrounded during a run.
      try {
        await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
      } catch (e) {}
    })();
  }, []);

  function selectStation(station) {
    if (current?.url === station.url) {
      status.playing ? player.pause() : player.play();
      return;
    }
    setCurrent(station);
  }

  useEffect(() => {
    if (current) player.play();
  }, [current]);

  async function handleAddStation() {
    if (!newName.trim() || !newUrl.trim()) {
      Alert.alert('입력 필요', '방송 이름과 스트리밍 주소를 모두 입력해주세요.');
      return;
    }
    const updated = await addStation({ name: newName.trim(), url: newUrl.trim() });
    setStations(updated);
    setNewName('');
    setNewUrl('');
    setShowAdd(false);
  }

  function confirmDelete(station) {
    Alert.alert('방송 삭제', `"${station.name}"을(를) 목록에서 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          if (current?.url === station.url) {
            player.pause();
            setCurrent(null);
          }
          setStations(await deleteStation(station.url));
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.eyebrow}>라디오</Text>
      <Text style={styles.title}>인터넷 라디오</Text>

      {current && (
        <View style={styles.nowPlaying}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nowPlayingLabel}>
              {status.isBuffering ? '연결 중...' : status.playing ? '재생 중' : '일시정지'}
            </Text>
            <Text style={styles.nowPlayingName} numberOfLines={1}>{current.name}</Text>
          </View>
          {status.isBuffering ? (
            <ActivityIndicator color={colors.trail} />
          ) : (
            <Pressable
              style={styles.playBtn}
              onPress={() => (status.playing ? player.pause() : player.play())}
            >
              <Text style={styles.playBtnText}>{status.playing ? '⏸' : '▶'}</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.listHeaderRow}>
        <Text style={styles.section}>채널 목록</Text>
        <Pressable onPress={() => setShowAdd((v) => !v)}>
          <Text style={styles.addToggle}>{showAdd ? '취소' : '+ 채널 추가'}</Text>
        </Pressable>
      </View>

      {showAdd && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="방송 이름 (예: 우리 동네 FM)"
            placeholderTextColor={colors.faint}
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={styles.input}
            placeholder="스트리밍 주소 (https://... .mp3 또는 .m3u8)"
            placeholderTextColor={colors.faint}
            value={newUrl}
            onChangeText={setNewUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.addBtn} onPress={handleAddStation}>
            <Text style={styles.addBtnText}>추가하기</Text>
          </Pressable>
        </View>
      )}

      {stations.map((s, i) => {
        const isCurrent = current?.url === s.url;
        return (
          <Pressable key={i} style={[styles.stationItem, isCurrent && styles.stationItemActive]} onPress={() => selectStation(s)}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stationName, isCurrent && styles.stationNameActive]} numberOfLines={1}>
                {s.name}
              </Text>
              <Text style={styles.stationUrl} numberOfLines={1}>{s.url}</Text>
            </View>
            <Pressable hitSlop={10} onPress={() => confirmDelete(s)}>
              <Text style={styles.deleteText}>삭제</Text>
            </Pressable>
          </Pressable>
        );
      })}

      <View style={styles.note}>
        <Text style={styles.noteText}>
          국내 방송사(KBS·MBC·SBS 등) 공식 앱은 대부분 자체 앱 안에서만 재생되도록 막혀있어요. 원하는 방송의 스트리밍
          주소(.mp3 또는 .m3u8로 끝나는 링크)를 알고 계시면 위에서 직접 추가해서 들을 수 있어요.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.faint, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: 4, marginBottom: 18 },
  nowPlaying: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.trail, borderRadius: 16, padding: 16, marginBottom: 20 },
  nowPlayingLabel: { color: '#fff', fontSize: 11, opacity: 0.85, marginBottom: 4 },
  nowPlayingName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  playBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  playBtnText: { color: '#fff', fontSize: 16 },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  section: { fontSize: 15, fontWeight: '600', color: colors.ink },
  addToggle: { fontSize: 12, color: colors.trail, fontWeight: '600' },
  addForm: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12, marginBottom: 14 },
  input: { backgroundColor: colors.paper, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.ink, marginBottom: 8 },
  addBtn: { backgroundColor: colors.ink, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  stationItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, marginBottom: 8 },
  stationItemActive: { borderColor: colors.trail, backgroundColor: colors.trailLight },
  stationName: { fontSize: 13, fontWeight: '600', color: colors.ink, marginBottom: 3 },
  stationNameActive: { color: colors.trail },
  stationUrl: { fontSize: 11, color: colors.muted },
  deleteText: { fontSize: 12, color: colors.alert, fontWeight: '600', marginLeft: 10 },
  note: { backgroundColor: colors.trailLight, borderRadius: 12, padding: 14, marginTop: 10 },
  noteText: { fontSize: 12, color: colors.trail, lineHeight: 18 },
});
