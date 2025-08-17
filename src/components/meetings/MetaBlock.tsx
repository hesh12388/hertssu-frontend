
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { MeetingResponseDto } from "../../../types/meeting";

const MetaBlock = ({ meeting, loadingFresh }: { meeting: MeetingResponseDto; loadingFresh: boolean }) => {
  return (
    <>
      <View style={styles.group}>
        <View style={styles.row}>
          <Icon name="information-circle-outline" />
          <Text style={styles.secondary}>Created: {meeting?.createdAt ?? "—"}</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Icon name="refresh-outline" />
          <Text style={styles.secondary}>Updated: {meeting?.updatedAt ?? "—"}</Text>
        </View>
      </View>

      {loadingFresh && (
        <View style={{ padding: 12, alignItems: "center" }}>
          <ActivityIndicator size="small" color="#E9435E" />
          <Text style={{ marginTop: 6, color: "#888" }}>Refreshing…</Text>
        </View>
      )}
    </>
  );
};

const Icon = ({ name }: { name: any }) => (
  <View style={styles.iconBox}>
    <Ionicons name={name} size={18} color="#888" />
  </View>
);

const styles = StyleSheet.create({
  group: {
    backgroundColor: "#fff",
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  iconBox: { width: 28, alignItems: "center", marginRight: 10 },
  secondary: { fontSize: 13, color: "#6b7280" },
});

export default MetaBlock;

