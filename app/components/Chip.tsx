import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Chip({ label, color = '#f3f4f6' }: { label: string; color?: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color }]}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 6, marginBottom: 6 },
  chipText: { fontSize: 12, color: '#374151' },
});