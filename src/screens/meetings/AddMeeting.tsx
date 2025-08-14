import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Dimensions,
    Keyboard,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../../App";
import { CreateMeetingPayload } from "../../../types/meeting";

const roleHierarchy = ["Associate", "Manager", "Admin"]; // adjust to your roles

const AddMeetingModal = ({ visible, onClose, onMeetingCreated }: any) => {
  const auth = useAuth();
  const api = auth?.api;
  const currentUserRole = auth?.user?.role || "Associate";

  // Form
  const [form, setForm] = useState<CreateMeetingPayload>({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    participants: [],
  });
  const handleChange = (field: keyof CreateMeetingPayload, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Anchoring + keyboard
  const searchInputRef = useRef<TextInput>(null);
  const [searchBox, setSearchBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const windowH = Dimensions.get("window").height;
  const dropdownMaxH = 220;

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
      // re-measure when keyboard appears
      requestAnimationFrame(measureSearchBox);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const measureSearchBox = () => {
    searchInputRef.current?.measureInWindow?.((x, y, w, h) => {
      setSearchBox({ x, y, w, h });
    });
  };

  const canAddUser = (targetRole: string) =>
    roleHierarchy.indexOf(currentUserRole) > roleHierarchy.indexOf(targetRole);

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setDropdownVisible(false);
      return;
    }
    try {
      const res = await api?.get(`/users/search?name=${encodeURIComponent(query)}`);
      const list = res?.data || [];
      setSearchResults(list);
      setDropdownVisible(list.length > 0);
      requestAnimationFrame(measureSearchBox);
    } catch (err) {
      console.error("❌ Error searching users:", err);
      setSearchResults([]);
      setDropdownVisible(false);
    }
  };

  const addParticipant = (user: any) => {
    if (!canAddUser(user.role)) {
      alert("You cannot add someone with a higher or equal role.");
      return;
    }
    if (!(form.participants ?? []).includes(user.email)) {
      setForm((prev) => ({
        ...prev,
        participants: [...(prev.participants ?? []), user.email],
      }));
    }
    setDropdownVisible(false);
  };

  const removeParticipant = (email: string) =>
    setForm((prev) => ({
      ...prev,
      participants: (prev.participants ?? []).filter((e) => e !== email),
    }));

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await api?.post("/meetings", form);
      onMeetingCreated?.();
      onClose();
    } catch (err) {
      console.error("❌ Error creating meeting:", err);
    } finally {
      setLoading(false);
    }
  };

  // Compute dropdown position: try below input, clamp above keyboard if needed
  const desiredTop = useMemo(() => searchBox.y + searchBox.h + 4, [searchBox]);
  const clampedTop = useMemo(() => {
    const bottomLimit = windowH - keyboardHeight - dropdownMaxH - 12;
    return Math.min(desiredTop, bottomLimit);
  }, [desiredTop, windowH, keyboardHeight]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Modal card */}
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Meeting</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <TextInput
              placeholder="Title"
              placeholderTextColor="#000"
              value={form.title}
              onChangeText={(t) => handleChange("title", t)}
              style={styles.input}
            />
            <TextInput
              placeholder="Description"
              placeholderTextColor="#000"
              value={form.description}
              onChangeText={(t) => handleChange("description", t)}
              style={styles.input}
            />
            <TextInput
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor="#000"
              value={form.date}
              onChangeText={(t) => handleChange("date", t)}
              style={styles.input}
            />
            <TextInput
              placeholder="Start Time (HH:mm)"
              placeholderTextColor="#000"
              value={form.startTime}
              onChangeText={(t) => handleChange("startTime", t)}
              style={styles.input}
            />
            <TextInput
              placeholder="End Time (HH:mm)"
              placeholderTextColor="#000"
              value={form.endTime}
              onChangeText={(t) => handleChange("endTime", t)}
              style={styles.input}
            />

            {/* Participant search */}
            <TextInput
              ref={searchInputRef}
              placeholder="Search users..."
              placeholderTextColor="#000"
              value={searchQuery}
              onChangeText={searchUsers}
              onFocus={() => {
                requestAnimationFrame(measureSearchBox);
                if (searchResults.length > 0) setDropdownVisible(true);
              }}
              onBlur={() => {
                // Keep dropdown visible only if tapping inside it; simplest is to hide on blur
                setTimeout(() => setDropdownVisible(false), 150);
              }}
              style={styles.input}
            />

            {/* Selected participants chips */}
            <View style={styles.participantsList}>
              {(form.participants ?? []).map((email) => (
                <View key={email} style={styles.chip}>
                  <Text style={styles.chipText}>{email}</Text>
                  <TouchableOpacity onPress={() => removeParticipant(email)}>
                    <Ionicons name="close-circle" size={18} color="red" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Saving..." : "Save Meeting"}</Text>
          </TouchableOpacity>
        </View>

        {/* Anchored dropdown overlay (absolute, aligned to search input, clamped above keyboard) */}
        {dropdownVisible && searchResults.length > 0 && (
          <View
            pointerEvents="box-none"
            style={[
              styles.dropdown,
              {
                top: clampedTop,
                left: Math.max(12, searchBox.x),
                width: Math.max(180, searchBox.w),
                maxHeight: dropdownMaxH,
              },
            ]}
          >
            <ScrollView keyboardShouldPersistTaps="handled">
              {searchResults.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.dropdownItem}
                  onPress={() => addParticipant(user)}
                >
                  <Text style={styles.dropdownText}>
                    {user.firstName} {user.lastName} ({user.role})
                  </Text>
                  <Text style={styles.dropdownSub}>{user.email}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "90%",
    maxHeight: "90%",
    // shadow
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    backgroundColor: "#fff",
  },
  participantsList: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    margin: 4,
  },
  chipText: { fontSize: 12 },
  button: { backgroundColor: "#E9435E", padding: 14, borderRadius: 8, marginTop: 12 },
  buttonText: { color: "#fff", fontSize: 16, textAlign: "center" },

  // Dropdown
  dropdown: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    // shadow
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12 },
      android: { elevation: 10 },
    }),
    zIndex: 9999,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  dropdownText: { fontSize: 14, fontWeight: "600" },
  dropdownSub: { fontSize: 12, color: "#666" },
});

export default AddMeetingModal;
