// src/screens/meetings/ParticipantPicker.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type UserRow = {
  id: number;
  name: string;
  email: string;
  role?: string;
  committeeName?: string;
};

type Props = {
  users: UserRow[];
  loading?: boolean;
  error?: string | null;

  initialSelectedIds?: number[];
  title?: string;

  onSubmit: (ids: number[]) => void;
  onClose: () => void;
};

const RED = "#E9435E";

// split "first names ... last" for display + initials
const splitName = (fullName?: string) => {
  if (!fullName) return { firstName: "User", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");
  return { firstName, lastName };
};

const ParticipantPicker: React.FC<Props> = ({
  users,
  loading = false,
  error = null,
  initialSelectedIds = [],
  title = "Add participants",
  onSubmit,
  onClose,
}) => {
  const [query, setQuery] = useState("");

  // Always keep local selection in sync with prop and deduped
  const [selectedIds, setSelectedIds] = useState<number[]>(
    Array.from(new Set(initialSelectedIds))
  );
  useEffect(() => {
    setSelectedIds(Array.from(new Set(initialSelectedIds)));
  }, [JSON.stringify(initialSelectedIds)]);

  // Deduplicate users by id first, then filter by query
  const uniqueUsers = useMemo(() => {
    const byId = new Map<number, UserRow>();
    for (const u of users) {
      if (!byId.has(u.id)) byId.set(u.id, u);
    }
    return Array.from(byId.values());
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return uniqueUsers;
    return uniqueUsers.filter((u) => {
      const { firstName, lastName } = splitName(u.name);
      return (
        (firstName + " " + lastName).toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [uniqueUsers, query]);

  const toggle = (u: UserRow) => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (set.has(u.id)) set.delete(u.id);
      else set.add(u.id);
      return Array.from(set);
    });
  };

  const removeChip = (id: number) =>
    setSelectedIds((prev) => Array.from(new Set(prev.filter((x) => x !== id))));

  const done = () => onSubmit(Array.from(new Set(selectedIds)));

  const renderItem = ({ item }: { item: UserRow }) => {
    const { firstName, lastName } = splitName(item.name);
    const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
    const picked = selectedIds.includes(item.id);

    return (
      <TouchableOpacity style={styles.row} onPress={() => toggle(item)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "U"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.role ?? "Member"}
            {item.committeeName ? ` · ${item.committeeName}` : ""}
          </Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
        <Ionicons
          name={picked ? "checkbox" : "square-outline"}
          size={22}
          color={picked ? RED : "#999"}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity onPress={done} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Chips */}
      {selectedIds.length > 0 && (
        <View style={styles.chipsWrap}>
          {Array.from(new Set(selectedIds)).map((id) => {
            const u = users.find((x) => x.id === id);
            return (
              <View key={id} style={styles.chip}>
                <Text style={styles.chipText}>{u?.email ?? `#${id}`}</Text>
                <TouchableOpacity onPress={() => removeChip(id)}>
                  <Ionicons name="close-circle" size={18} color="#c33" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Search + results */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name or email"
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={{ color: "red" }}>Error loading data. Please try again later.</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(u) => `${u.id}`}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

export default ParticipantPicker;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#eee",
  },
  errorContainer: { padding: 20, backgroundColor: "#ffebee", margin: 10, borderRadius: 8 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  headerBtn: { backgroundColor: "#E9435E", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  headerBtnText: { color: "#fff", fontWeight: "700" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  chip: { flexDirection: "row", alignItems: "center", backgroundColor: "#f2f2f2", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 12, color: "#333" },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    margin: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 10, backgroundColor: "#fafafa",
  },
  searchInput: { flex: 1, fontSize: 15, color: "#111" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#eee",
  },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#555", fontWeight: "700" },
  name: { fontSize: 15, fontWeight: "700", color: "#111" },
  meta: { fontSize: 12, color: "#666", marginTop: 2 },
  email: { fontSize: 12, color: "#888", marginTop: 2 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
