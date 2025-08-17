import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kpi: { flexGrow: 1, minWidth: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eef0f3' },
  kpiLabel: { fontSize: 12, color: '#6b7280' },
  kpiValue: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 2 },
  kpiSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
