// src/screens/meetings/AddMeetingModal.tsx
import { useCreateMeeting } from "@/src/hooks/useMeetings";
import { useUsers } from "@/src/hooks/useUsers";
import ParticipantPicker from "@/src/screens/meetings/ParticipantPicker";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../App";
import TimeSheet from "../../components/TimeSheet";
import { CreateMeetingPayload } from "../../types/meeting";

type Props = {
  visible: boolean;
  onClose: () => void;
  onMeetingCreated?: () => void;
  initialStart?: Date;
};

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

const splitName = (fullName?: string) => {
  if (!fullName) return { firstName: "User", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");
  return { firstName, lastName };
};

const AddMeetingModal: React.FC<Props> = ({ visible, onClose, onMeetingCreated, initialStart }) => {
  const { api, user } = useAuth() ?? {};
  const createMeeting = useCreateMeeting(api!);

  // fetch users once here and pass to picker
  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();

  // form state
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(false);

  const [start, setStart] = useState<Date>(initialStart ?? new Date());
  const [end, setEnd] = useState<Date>(new Date(Date.now() + 30 * 60 * 1000));

  // participants by id only
  const [participantIds, setParticipantIds] = useState<number[]>([]);

  // participant picker modal
  const [pickerOpen, setPickerOpen] = useState(false);

  // time pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // reset when opened
  useEffect(() => {
    if (!visible) return;
    const base = initialStart ?? new Date();
    setStart(base);
    setEnd(new Date(base.getTime() + 30 * 60 * 1000));
    setTitle("");
    setLocation("");
    setDescription("");
    setAllDay(false);
    setParticipantIds([]);
  }, [visible, initialStart]);

  const { firstName, lastName } = splitName(user?.name);
  const organizerInitials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "US";
  const organizerName = user?.name ?? "User";

  const disabled =
    createMeeting.isPending ||
    title.trim().length === 0 ||
    !start ||
    !end ||
    (!allDay && end <= start);

  const handleSave = () => {
    const payload: CreateMeetingPayload = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      date: start.toISOString().slice(0, 10),
      startTime: allDay ? "00:00" : start.toTimeString().slice(0, 5),
      endTime: allDay ? "23:59" : end.toTimeString().slice(0, 5),
      isAllDay: allDay,
      participantIds,
    };

    createMeeting.mutate(payload, {
      onSuccess: () => {
        onMeetingCreated?.();
        onClose();
      },
      onError: (err) => {
        console.error("Create meeting failed:", err);
        Alert.alert("Error", "Could not create meeting. Try again.");
      },
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>New Event</Text>

            <TouchableOpacity onPress={handleSave} style={[styles.headerBtn, disabled && { opacity: 0.6 }]} disabled={disabled}>
              <Text style={styles.headerBtnText}>
                {createMeeting.isPending ? "Saving..." : "Done"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Participants (opens picker modal) */}
            <View style={styles.group}>
              <TouchableOpacity style={styles.rowBetween} onPress={() => setPickerOpen(true)}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBox}>
                    <Ionicons name="person-add-outline" size={18} color="#888" />
                  </View>
                  <Text style={styles.rowLabel}>Add participants</Text>
                </View>
                {participantIds.length > 0 ? (
                  <Text style={styles.trailing}>{participantIds.length} selected</Text>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                )}
              </TouchableOpacity>
            </View>

            {/* Organizer */}
            <View style={styles.group}>
              <View style={styles.rowStatic}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{organizerInitials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.primary}>{organizerName}</Text>
                  <Text style={styles.secondary}>Organizer</Text>
                </View>
              </View>
            </View>

            {/* All day & Time */}
            <View style={styles.group}>
              <View style={styles.rowBetween}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBox}>
                    <Ionicons name="time-outline" size={18} color="#888" />
                  </View>
                  <Text style={styles.rowLabel}>All day</Text>
                </View>
                <Switch
                  value={allDay}
                  onValueChange={(v) => {
                    setAllDay(v);
                    if (v) {
                      const s = new Date(start);
                      s.setHours(0, 0, 0, 0);
                      const e = new Date(start);
                      e.setHours(23, 59, 0, 0);
                      setStart(s);
                      setEnd(e);
                    } else if (end <= start) {
                      setEnd(new Date(start.getTime() + 30 * 60 * 1000));
                    }
                  }}
                />
              </View>

              {!allDay && (
                <>
                  <TouchableOpacity style={styles.rowBetween} onPress={() => setShowStartPicker(true)}>
                    <Text style={[styles.rowLabel, { marginLeft: 44 }]}>Start</Text>
                    <Text style={styles.trailing}>{fmt(start)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.rowBetween, { borderBottomWidth: 0 }]} onPress={() => setShowEndPicker(true)}>
                    <Text style={[styles.rowLabel, { marginLeft: 44 }]}>End</Text>
                    <Text style={styles.trailing}>{fmt(end)}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Location */}
            <View style={styles.group}>
              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <Ionicons name="location-outline" size={18} color="#888" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Location"
                  placeholderTextColor="#999"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* Title */}
            <View style={styles.group}>
              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <Ionicons name="pencil" size={18} color="#888" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Add a title"
                  placeholderTextColor="#999"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.group}>
              <View style={[styles.row, { borderBottomWidth: 0 }]}>
                <View style={styles.iconBox}>
                  <Ionicons name="document-text-outline" size={18} color="#888" />
                </View>
                <TextInput
                  style={[styles.input, { height: 120, textAlignVertical: "top" }]}
                  placeholder="Description"
                  placeholderTextColor="#999"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </View>
            </View>

            {/* Mutation error banner */}
            {createMeeting.isError && (
              <View style={styles.errorContainer}>
                <Text style={{ color: "red" }}>
                  Error creating meeting. Please try again later.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Time pickers */}
          {!allDay && (
            <>
              <TimeSheet
                visible={showStartPicker}
                title="Pick start time"
                initial={start}
                onPick={(d) => {
                  setStart(d);
                  if (end <= d) setEnd(new Date(d.getTime() + 30 * 60 * 1000));
                }}
                onClose={() => setShowStartPicker(false)}
              />
              <TimeSheet
                visible={showEndPicker}
                title="Pick end time"
                initial={end}
                minimumDate={start}
                onPick={setEnd}
                onClose={() => setShowEndPicker(false)}
              />
            </>
          )}

          {/* Participant picker as its own Modal */}
          <Modal
            visible={pickerOpen}
            animationType="slide"
            presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
            onRequestClose={() => setPickerOpen(false)}
          >
            <ParticipantPicker
              users={users.map(u => ({
                id: u.id,
                name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
                email: u.email,
                role: u.role,
                committeeName: u.committeeName,
              }))}
              loading={usersLoading}
              error={usersError ? "Failed to load users." : null}
              initialSelectedIds={participantIds}
              onSubmit={(ids) => {
                setParticipantIds(ids);
                setPickerOpen(false);
              }}
              onClose={() => setPickerOpen(false)}
            />
          </Modal>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: { maxHeight: "92%", backgroundColor: "#fff" },
  header: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 14 : 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  group: {
    backgroundColor: "#fff",
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  rowLeft: { flexDirection: "row", alignItems: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  rowLabel: { fontSize: 16, color: "#111" },
  trailing: { color: "#555", fontSize: 14 },
  iconBox: { width: 28, alignItems: "center", marginRight: 10 },
  input: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111",
  },
  rowStatic: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#eaeaea", alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: "#444", fontWeight: "700" },
  primary: { fontSize: 16, fontWeight: "700", color: "#111" },
  secondary: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#E9435E" },
  headerBtnText: { color: "#fff", fontWeight: "700" },
  errorContainer: {
    padding: 16, marginHorizontal: 16, marginTop: 10, borderRadius: 8, backgroundColor: "#ffecec",
  },
});

export default AddMeetingModal;
