import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { getProfile, saveProfile, defaultProfile } from '../storage';
import { APP_VERSION, BUILD_DATE } from '../buildInfo';
import { showBatteryGuide, requestIgnoreBatteryOptimization } from '../battery';
import { colors } from '../theme';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(defaultProfile);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    (async () => setProfile(await getProfile()))();
  }, []);

  function set(key, value) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function onSave() {
    const cleaned = {
      ...profile,
      weight: parseFloat(profile.weight) || 65,
      height: parseFloat(profile.height) || 170,
      age: parseInt(profile.age) || 30,
      goalDist: parseFloat(profile.goalDist) || 15,
    };
    await saveProfile(cleaned);
    setProfile(cleaned);
    setFlash('저장되었습니다');
    setTimeout(() => setFlash(''), 1800);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.eyebrow}>개인 설정</Text>
      <Text style={styles.title}>내 정보</Text>

      <Text style={styles.section}>신체 정보</Text>
      <View style={styles.group}>
        <Row label="체중 (kg)">
          <TextInput style={styles.input} keyboardType="numeric" value={String(profile.weight)} onChangeText={(v) => set('weight', v)} />
        </Row>
        <Row label="신장 (cm)">
          <TextInput style={styles.input} keyboardType="numeric" value={String(profile.height)} onChangeText={(v) => set('height', v)} />
        </Row>
        <Row label="나이">
          <TextInput style={styles.input} keyboardType="numeric" value={String(profile.age)} onChangeText={(v) => set('age', v)} />
        </Row>
        <Row label="성별" last>
          <View style={styles.genderRow}>
            {[
              { key: 'f', label: '여성' },
              { key: 'm', label: '남성' },
            ].map((g) => (
              <Pressable
                key={g.key}
                onPress={() => set('gender', g.key)}
                style={[styles.genderBtn, profile.gender === g.key && styles.genderBtnActive]}
              >
                <Text style={[styles.genderBtnText, profile.gender === g.key && styles.genderBtnTextActive]}>{g.label}</Text>
              </Pressable>
            ))}
          </View>
        </Row>
      </View>

      <Text style={styles.section}>주간 목표</Text>
      <View style={styles.group}>
        <Row label="목표 거리 (km)">
          <TextInput style={styles.input} keyboardType="numeric" value={String(profile.goalDist)} onChangeText={(v) => set('goalDist', v)} />
        </Row>
        <Row label="목표 페이스 (분/km)" last>
          <TextInput style={styles.input} value={profile.goalPace} onChangeText={(v) => set('goalPace', v)} />
        </Row>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          체중을 입력하면 러닝할 때 칼로리가 개인 맞춤으로 계산돼요. (약 1.04 kcal × 체중(kg) × 거리(km))
        </Text>
      </View>

      <Pressable style={styles.saveBtn} onPress={onSave}>
        <Text style={styles.saveBtnText}>저장하기</Text>
      </Pressable>
      {!!flash && <Text style={styles.flash}>{flash}</Text>}

      <Text style={[styles.section, { marginTop: 22 }]}>절전 모드 대응</Text>
      <View style={styles.group}>
        <Pressable style={styles.row} onPress={requestIgnoreBatteryOptimization}>
          <Text style={styles.rowLabel}>배터리 최적화 제외 요청</Text>
          <Text style={styles.rowLabel}>›</Text>
        </Pressable>
        <Pressable style={[styles.row, { borderBottomWidth: 0 }]} onPress={showBatteryGuide}>
          <Text style={styles.rowLabel}>절전 모드 설정 방법 보기</Text>
          <Text style={styles.rowLabel}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.versionText}>버전 {APP_VERSION} · {BUILD_DATE} 빌드</Text>
    </ScrollView>
  );
}

function Row({ label, children, last }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.faint, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: 4, marginBottom: 18 },
  section: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: colors.ink },
  group: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 14, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLabel: { fontSize: 13, color: colors.ink },
  input: { fontSize: 14, fontWeight: '600', color: colors.ink, textAlign: 'right', minWidth: 90 },
  genderRow: { flexDirection: 'row', gap: 6 },
  genderBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.line },
  genderBtnActive: { backgroundColor: colors.trail, borderColor: colors.trail },
  genderBtnText: { fontSize: 12, color: colors.ink },
  genderBtnTextActive: { color: '#fff' },
  note: { backgroundColor: colors.trailLight, borderRadius: 12, padding: 14, marginBottom: 18 },
  noteText: { fontSize: 12, color: colors.trail, lineHeight: 18 },
  saveBtn: { backgroundColor: colors.ink, borderRadius: 14, padding: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  flash: { textAlign: 'center', fontSize: 12, color: colors.trail, marginTop: 8 },
  versionText: { textAlign: 'center', fontSize: 11, color: colors.faint, marginTop: 20 },
});
