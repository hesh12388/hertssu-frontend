import { useAuth } from "@/App";
import { StatusMessage } from "@/src/components/StatusMessage";
import { useMeetingDetails } from "@/src/hooks/useMeetingDetails";
import { useUsers } from "@/src/hooks/useUsers";
import ParticipantPicker from "@/src/screens/meetings/ParticipantPicker";
import type { CreateMeetingPayload, MeetingResponseDto } from "@/src/types/meeting";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MeetingPerformanceTab from "./MeetingPerformanceTab";

type TabKey = "INFO" | "PERF";

type Props = {
  visible: boolean;
  onClose: () => void;
  meetingId: number | null;
  seed?: MeetingResponseDto;
  onUpdated?: (m: MeetingResponseDto) => void;
  onDeleted?: () => void;

  /** QUICK FIX: control if Performance tab should be shown (true for history, false for upcoming) */
  showPerformanceTab?: boolean;
};

const normalizeP = (p: any) => ({
  id: p?.id ?? p?.userId ?? p?.user?.id,
  email: p?.email ?? p?.user?.email ?? "",
  firstName: p?.firstName ?? p?.user?.firstName ?? "",
  lastName: p?.lastName ?? p?.user?.lastName ?? "",
});

const MeetingDetails: React.FC<Props> = ({
  visible,
  onClose,
  meetingId,
  seed,
  onUpdated,
  onDeleted,
  showPerformanceTab = true,
}) => {
  const { api } = useAuth() ?? {};
  const {
    data: meeting,
    isLoading,
    isError,
    updateMeeting,
    deleteMeeting,
  } = useMeetingDetails(api ?? null, meetingId, seed);

  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();

  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<TabKey>("INFO");

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const seededRef = useRef(false);
  const lastMeetingIdRef = useRef<number | null>(null);

  const participantsNorm = useMemo(
    () => (meeting?.participants ?? [])
      .map(normalizeP)
      .filter((p) => p.id != null),
    [meeting?.participants]
  );

  // If PERF becomes disallowed, force back to INFO
  useEffect(() => {
    if (!showPerformanceTab && tab === "PERF") setTab("INFO");
  }, [showPerformanceTab, tab]);

  // Reset seed guard when opening or switching meetings
  useEffect(() => {
    if (!visible) return;
    if (meeting?.meetingId !== lastMeetingIdRef.current) {
      seededRef.current = false;
      lastMeetingIdRef.current = meeting?.meetingId ?? null;
    }
  }, [visible, meeting?.meetingId]);

  // Seed from meeting only once per open or meetingId
  useEffect(() => {
    if (!meeting) return;
    if (seededRef.current) return;

    setTitle(meeting.title ?? "");
    setLocation(meeting.location ?? "");
    setDescription(meeting.description ?? "");
    setAllDay(!!meeting.isAllDay);
    setParticipantIds(participantsNorm.map((p) => p.id));
    seededRef.current = true;
  }, [meeting, participantsNorm]);

  const usersById = useMemo(() => {
    const m = new Map<number, any>();
    for (const u of users) m.set(u.id, u);
    return m;
  }, [users]);

  const selectedPreview = useMemo(() => {
    const unique = Array.from(new Set(participantIds));
    return unique.map((id) => {
      const fromMeeting = participantsNorm.find((p) => p.id === id);
      if (fromMeeting) return fromMeeting;
      const u = usersById.get(id);
      return {
        id,
        email: u?.email ?? "",
        firstName: u?.firstName ?? "",
        lastName: u?.lastName ?? "",
      };
    });
  }, [participantIds, participantsNorm, usersById]);

  const payload: CreateMeetingPayload = useMemo(() => {
    const dateStr =
      meeting?.date ??
      new Date().toISOString().slice(0, 10);

    return {
      title,
      description,
      location,
      date: dateStr,
      startTime: allDay ? "00:00" : meeting?.startTime ?? "00:00",
      endTime: allDay ? "23:59" : meeting?.endTime ?? "23:59",
      isAllDay: allDay,
      participantIds: Array.from(new Set(participantIds)),
    };
  }, [title, description, location, allDay, participantIds, meeting]);


  const handleSave = async () => {
    if (!meeting) return;
    try {
      const updated = await updateMeeting.mutateAsync(payload);

      // Trust server participants after save
      const normalized = (updated?.participants ?? [])
        .map(normalizeP)
        .filter((p) => p.id != null)
        .map((p) => p.id as number);

      setParticipantIds(Array.from(new Set(normalized)));
      seededRef.current = true;
      setEditing(false);
      onUpdated?.(updated);
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  const handleDelete = async () => {
    if (!meeting) return;
    Alert.alert("Delete Meeting", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMeeting.mutateAsync();
            onDeleted?.();
            onClose();
          } catch (e) {
            console.error("Delete failed", e);
          }
        },
      },
    ]);
  };

  if (!visible) return null;
  const showLoading = isLoading && !meeting;

  // Build tabs dynamically (hide PERF when disallowed)
  const allowedTabs: TabKey[] = showPerformanceTab ? ["INFO", "PERF"] : ["INFO"];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Close</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>{editing ? "Edit Meeting" : "Meeting Details"}</Text>

            {editing ? (
              <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={updateMeeting.isPending}>
                {updateMeeting.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.headerBtnText}>Save</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.headerBtn}>
                <Text style={styles.headerBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Inline loading banners for non-error states */}
          {showLoading && <StatusMessage isLoading loadingMessage="Loading meeting..." />}
          {updateMeeting.isPending && <StatusMessage isLoading loadingMessage="Saving meeting..." />}
          {deleteMeeting.isPending && <StatusMessage isLoading loadingMessage="Deleting meeting..." />}

          {/* Tabs */}
          <View style={styles.tabs}>
            {allowedTabs.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t === "INFO" ? "Info" : "Performance"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          {showLoading ? (
            <StatusMessage isLoading loadingMessage="Loading meeting..." />
          ) : isError ? (
            <View style={styles.errorContainer}>
              <Text style={{ color: "red" }}>Error loading data. Please try again later.</Text>
            </View>
          ) : (
            meeting && (
              <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {tab === "INFO" && (
                  <>
                    <FormRow icon="pencil" editing={editing} value={title} onChange={setTitle} placeholder="Add a title" />
                    <FormRow icon="location-outline" editing={editing} value={location} onChange={setLocation} placeholder="Location" />

                    {/* Participants */}
                    <View style={styles.group}>
                      <TouchableOpacity
                        style={styles.rowBetween}
                        onPress={() => editing && setPickerOpen(true)}
                        disabled={!editing}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="person-add-outline" size={18} color="#888" style={{ marginRight: 10 }} />
                          <Text style={styles.rowLabel}>Participants ({participantIds.length})</Text>
                        </View>
                        {editing ? <Ionicons name="chevron-forward" size={18} color="#888" /> : null}
                      </TouchableOpacity>

                      {selectedPreview.length > 0 ? (
                        selectedPreview.map((participant) => (
                          <View key={`sel-${participant.id}`} style={styles.rowStatic}>
                            <View style={styles.avatar}>
                              <Text style={styles.avatarText}>
                                {(participant.firstName?.[0] || participant.email?.[0] || "?").toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.participantInfo}>
                              <Text style={styles.primary}>
                                {participant.firstName || participant.lastName
                                  ? `${participant.firstName ?? ""} ${participant.lastName ?? ""}`.trim()
                                  : participant.email}
                              </Text>
                              {(participant.firstName || participant.lastName) && (
                                <Text style={styles.secondary}>{participant.email}</Text>
                              )}
                            </View>
                            {editing && (
                              <TouchableOpacity onPress={() => setParticipantIds((prev) => prev.filter((x) => x !== participant.id))}>
                                <Ionicons name="trash-outline" size={20} color="#c33" />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))
                      ) : (
                        <View style={{ alignItems: "center", paddingVertical: 10 }}>
                          <Text style={{ color: "#666" }}>No participants selected.</Text>
                        </View>
                      )}
                    </View>

                    <FormRow
                      icon="document-text-outline"
                      editing={editing}
                      value={description}
                      onChange={setDescription}
                      placeholder="Description"
                      multiline
                    />

                    {/* Meta */}
                    <View style={styles.group}>
                      <View style={styles.row}>
                        <Ionicons name="information-circle-outline" size={18} color="#888" style={{ marginRight: 10 }} />
                        <Text style={styles.secondary}>Created: {meeting.createdAt}</Text>
                      </View>
                      <View style={[styles.row, { borderBottomWidth: 0 }]}>
                        <Ionicons name="refresh-outline" size={18} color="#888" style={{ marginRight: 10 }} />
                        <Text style={styles.secondary}>Updated: {meeting.updatedAt}</Text>
                      </View>
                    </View>

                    {!editing && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#ef4444", margin: 16 }]}
                        onPress={handleDelete}
                        disabled={deleteMeeting.isPending}
                      >
                        {deleteMeeting.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Delete</Text>}
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {/* Performance tab only when allowed */}
                {tab === "PERF" && showPerformanceTab && meeting && (
                  <MeetingPerformanceTab
                    meetingId={meeting.meetingId}
                    participants={selectedPreview.map((p) => ({
                      id: p.id,
                      email: p.email ?? "",
                      firstName: p.firstName ?? "",
                      lastName: p.lastName ?? "",
                    }))}
                  />
                )}
              </ScrollView>
            )
          )}

          {/* Participant Picker modal */}
          <Modal
            visible={pickerOpen && editing}
            animationType="slide"
            presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
            onRequestClose={() => setPickerOpen(false)}
          >
            {usersLoading && !usersError ? (
              <StatusMessage isLoading loadingMessage="Loading users..." />
            ) : usersError ? (
              <View style={styles.errorContainer}>
                <Text style={{ color: "red" }}>Failed to load users.</Text>
              </View>
            ) : (
              <ParticipantPicker
                users={users.map((u) => ({
                  id: u.id,
                  name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
                  email: u.email,
                  role: u.role,
                  committeeName: u.committeeName,
                }))}
                loading={false}
                error={null}
                initialSelectedIds={participantIds}
                onSubmit={(ids) => {
                  setParticipantIds(Array.from(new Set(ids)));
                  setPickerOpen(false);
                }}
                onClose={() => setPickerOpen(false)}
              />
            )}
          </Modal>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const FormRow = ({
  icon,
  editing,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  icon: any;
  editing: boolean;
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
  multiline?: boolean;
}) => (
  <View style={styles.row}>
    <Ionicons name={icon} size={18} color="#888" style={{ marginRight: 10 }} />
    {editing ? (
      <TextInput
        style={[styles.input, multiline && { height: 80 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline={multiline}
      />
    ) : (
      <Text style={styles.valueText}>{value || "-"}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: { maxHeight: "92%", backgroundColor: "#fff" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#eee",
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerBtn: { padding: 8, borderRadius: 8, backgroundColor: "#E9435E" },
  headerBtnText: { color: "#fff", fontWeight: "700" },
  tabs: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#eee" },
  tabBtn: { flex: 1, alignItems: "center", padding: 12 },
  tabBtnActive: { borderBottomWidth: 2, borderColor: "#E9435E" },
  tabText: { color: "#666" },
  tabTextActive: { color: "#E9435E", fontWeight: "700" },
  group: {
    backgroundColor: "#fff",
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  row: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#eee",
  },
  rowBetween: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#eee",
  },
  input: { flex: 1, backgroundColor: "#f7f7f7", borderRadius: 8, padding: 8 },
  valueText: { fontSize: 16, color: "#111", flexShrink: 1 },
  rowLabel: { fontSize: 16, color: "#111" },
  rowStatic: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#e5e5e5",
    justifyContent: "center", alignItems: "center", marginRight: 8,
  },
  avatarText: { fontWeight: "700", color: "#444" },
  participantInfo: { flex: 1 },
  primary: { fontSize: 15, fontWeight: "600" },
  secondary: { fontSize: 13, color: "#6b7280" },
  actionBtn: { paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  errorContainer: { padding: 20, backgroundColor: "#ffebee", margin: 10, borderRadius: 8 },
});

export default MeetingDetails;
