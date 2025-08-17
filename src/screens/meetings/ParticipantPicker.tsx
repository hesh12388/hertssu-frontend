import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
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
import { useAuth } from "../../../App";

type UserRow = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  committeeName?: string;
};

type Props = {
  initialSelected?: string[];
  title?: string;
  onSubmit?: (emails: string[]) => void;
  onClose: () => void;
};

const RED = "#E9435E";

const ParticipantPicker: React.FC<Props> = ({
  initialSelected = [],
  title = "Add participants",
  onSubmit,
  onClose,
}) => {
  const auth = useAuth();
  const api = auth?.api;

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!api) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/progress/search/users`, {
          params: { q: query || "", limit: 50 },
        });
        console.log("Search results:", res?.data);
        setResults(res?.data ?? []);
      } catch (e) {
        console.error("search users failed:", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, api]);

  const toggle = (u: UserRow) => {
    const email = u.email;
    setSelected((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const removeChip = (email: string) =>
    setSelected((prev) => prev.filter((e) => e !== email));

  const done = () => {
    onSubmit?.(selected);
    onClose();
  };

  const renderItem = ({ item }: { item: UserRow }) => {
    const picked = selected.includes(item.email);
    return (
      <TouchableOpacity style={styles.row} onPress={() => toggle(item)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.firstName?.[0] ?? "U").toUpperCase()}
            {(item.lastName?.[0] ?? "").toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.meta}>
            {(item.role ?? "Member")}
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

      {/* Selected chips */}
      {selected.length > 0 && (
        <View style={styles.chipsWrap}>
          {selected.map((email) => (
            <View key={email} style={styles.chip}>
              <Text style={styles.chipText}>{email}</Text>
              <TouchableOpacity onPress={() => removeChip(email)}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color="#c33"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>
          ))}
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
        ) : (
          <FlatList
            data={results}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  headerBtn: {
    backgroundColor: RED,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerBtnText: { color: "#fff", fontWeight: "700" },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, color: "#333" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    backgroundColor: "#fafafa",
  },
  searchInput: { flex: 1, fontSize: 15, color: "#111" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#555", fontWeight: "700" },

  name: { fontSize: 15, fontWeight: "700", color: "#111" },
  meta: { fontSize: 12, color: "#666", marginTop: 2 },
  email: { fontSize: 12, color: "#888", marginTop: 2 },

  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});