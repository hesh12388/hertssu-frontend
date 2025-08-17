// src/screens/MeetingDetails.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../App";
import {
  fetchMeetingSWRCached,
  primeMeetingCache,
} from "../../../services/meetingDetailsCache";
import {
  deleteMeeting,
  updateMeeting,
} from "../../../services/meetingServices";
import type { CreateMeetingPayload, MeetingResponseDto } from "../../../types/meeting";
import TimeSheet from "../../components/TimeSheet";
import ParticipantPicker from "./ParticipantPicker";

type Props = {
  visible: boolean;
  onClose: () => void;
  meetingId: number | null;                   // we fetch by id
  seed?: Partial<MeetingResponseDto>;         // pass minimal info from the list for instant fill
  onUpdated?: (updated: MeetingResponseDto) => void;
  onDeleted?: () => void;
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
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#E9435E",
  },
  headerBtnText: { color: "#fff", fontWeight: "700" },

  content: { backgroundColor: "#fff", borderTopLeftRadius: 14, borderTopRightRadius: 14 },

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
  rowStatic: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: { fontSize: 16, color: "#111" },
  valueText: { fontSize: 16, color: "#111", flexShrink: 1 },
  trailing: { color: "#555", fontSize: 14 },
  linkish: { color: "#2563eb", textDecorationLine: "underline" },
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

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eaeaea",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "#444", fontWeight: "700" },
  primary: { fontSize: 16, fontWeight: "700", color: "#111" },
  secondary: { fontSize: 13, color: "#6b7280", marginTop: 2 },

  partOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  partSheet: {
    flex: 1,
    maxHeight: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },

  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

const parseTime = (t?: string | null) => {
  if (!t) return { h: 0, m: 0 };
  const [hh, mm] = t.split(":");
  return { h: Number(hh || 0), m: Number(mm || 0) };
};
const pad = (n: number) => String(n).padStart(2, "0");
const toHHmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const MeetingDetails: React.FC<Props> = ({
  visible,
  onClose,
  meetingId,
  seed,
  onUpdated,
  onDeleted,
}) => {
  const auth = useAuth();
  const api = auth?.api;

  // fetched meeting (progressively hydrated via SWR)
  const [meeting, setMeeting] = useState<MeetingResponseDto | null>(null);
  const [loadingFresh, setLoadingFresh] = useState(false);

  // edit mode
  const [editing, setEditing] = useState(false);

  // form state (only used in edit mode)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState<Date>(new Date());
  const [end, setEnd] = useState<Date>(new Date(Date.now() + 30 * 60 * 1000));
  const [recurrenceRule, setRecurrenceRule] = useState<string>("");
  const [reminders, setReminders] = useState<number[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);

  // pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [participantsVisible, setParticipantsVisible] = useState(false);

  // actions
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // scroll helpers
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const storePos = (key: string) => (e: any) => (positions.current[key] = e.nativeEvent.layout.y);
  const scrollTo = (key: string) => {
    const y = positions.current[key] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
  };

  // whenever meeting changes (seed or fresh), (re)prefill the edit form
  useEffect(() => {
    if (!meeting) return;
    setTitle(meeting.title ?? "");
    setDescription(meeting.description ?? "");
    setLocation(meeting.location ?? "");
    setAllDay(!!meeting.isAllDay);
    setRecurrenceRule(meeting.recurrenceRule ?? "");
    setReminders(meeting.reminders ?? []);
    setParticipants(meeting.participantEmails ?? []);

    const base = new Date(`${meeting.date}T00:00:00`);
    if (meeting.isAllDay) {
      const s = new Date(base);
      s.setHours(0, 0, 0, 0);
      const e = new Date(base);
      e.setHours(23, 59, 0, 0);
      setStart(s);
      setEnd(e);
    } else {
      const { h: sh, m: sm } = parseTime(meeting.startTime);
      const { h: eh, m: em } = parseTime(meeting.endTime);
      const s = new Date(base);
      s.setHours(sh, sm, 0, 0);
      const e = new Date(base);
      e.setHours(eh, em, 0, 0);
      setStart(s);
      setEnd(e);
    }
  }, [meeting]);

  // SWR load: seed -> cache -> fresh
  useEffect(() => {
    if (!api || !visible || !meetingId) return;
    let cancelled = false;

    const hydrate = async () => {
      setLoadingFresh(true);
      try {
        await fetchMeetingSWRCached(api, meetingId, (m) => {
          if (cancelled) return;
          setMeeting(m);
        }, seed);
        // fresh fetch happens inside; we just flip loader off when it resolves
      } catch (e) {
        console.error("❌ Meeting fetch failed:", e);
      } finally {
        if (!cancelled) setLoadingFresh(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [api, visible, meetingId, seed]);

  const startEditing = () => setEditing(true);
  const stopEditing = () => {
    setEditing(false);
    // reset form from last known meeting (discard edits)
    if (meeting) {
      primeMeetingCache(meeting);
      setMeeting({ ...meeting }); // triggers effect to re-seed inputs
    }
  };

  const deleteById = async () => {
  if (!api || !meeting) return;
  try {
    setDeleting(true);
    await deleteMeeting(api, meeting.meetingId);
    onDeleted?.();
    onClose();
  } catch (e) {
    console.error("❌ Delete by ID failed:", e);
  } finally {
    setDeleting(false);
  }
};

// Delete an entire recurrence series by recurrenceId
const deleteByOccurrence = async () => {
  if (!api || !meeting?.recurrenceId) return;
  try {
    setDeleting(true);
    await deleteMeeting(api, Number(meeting.recurrenceId), { series: true });
    onDeleted?.();
    onClose();
  } catch (e) {
    console.error("❌ Delete series failed:", e);
  } finally {
    setDeleting(false);
  }
};
  const onSave = async () => {
  if (!api || !meeting) return;

  const payload: CreateMeetingPayload = {
    title,
    description,
    location,
    date: start.toISOString().slice(0, 10),
    startTime: allDay ? "00:00" : toHHmm(start),
    endTime: allDay ? "23:59" : toHHmm(end),
    isAllDay: allDay,
    participants,
    recurrenceRule: recurrenceRule || undefined,
    reminders: reminders.length ? reminders : [30],
    visibility: "PUBLIC",
  };

  if (meeting.recurrenceId && meeting.recurrenceRule) {
    Alert.alert(
      "Update Recurring Meeting",
      "Do you want to update just this occurrence or the entire series?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "This occurrence",
          onPress: async () => {
            try {
              setSaving(true);
              const updated = await updateMeeting(api, meeting.meetingId, payload);
              primeMeetingCache(updated);
              setMeeting(updated);
              setEditing(false);
              onUpdated?.(updated);
            } catch (e) {
              console.error("❌ Update occurrence failed:", e);
            } finally {
              setSaving(false);
            }
          },
        },
        {
          text: "Entire series",
          onPress: async () => {
            try {
              setSaving(true);
              if (typeof meeting.recurrenceId === "string" || typeof meeting.recurrenceId === "number") {
                const updated = await updateMeeting(api, meeting.recurrenceId, payload, { series: true });
                primeMeetingCache(updated);
                setMeeting(updated);
                setEditing(false);
                onUpdated?.(updated);
              } else {
                Alert.alert("Error", "Recurrence ID is missing or invalid.");
              }
            } catch (e) {
              console.error("❌ Update series failed:", e);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  } else {
    try {
      setSaving(true);
      const updated = await updateMeeting(api, meeting.meetingId, payload);
      primeMeetingCache(updated);
      setMeeting(updated);
      setEditing(false);
      onUpdated?.(updated);
    } catch (e) {
      console.error("❌ Update meeting failed:", e);
    } finally {
      setSaving(false);
    }
  }
};


  const onDeletePress = () => {
  if (!api || !meeting) return;

  if (meeting.recurrenceId && meeting.recurrenceRule) {
    Alert.alert(
      "Delete Recurring Meeting",
      "Do you want to delete just this occurrence or the entire series?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "This occurrence", style: "destructive", onPress: deleteById },
        { text: "Entire series", style: "destructive", onPress: deleteByOccurrence },
      ]
    );
  } else {
    Alert.alert("Delete Meeting", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteById },
    ]);
  }
};



  if (!visible) return null;

  const isHydrating = !meeting; // first paint: render loader, but overlay + sheet already shown

  return (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        style={styles.sheet}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Close</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {editing ? "Edit Event" : "Event Details"}
          </Text>

          {editing ? (
            <TouchableOpacity
              onPress={onSave}
              style={styles.headerBtn}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.headerBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={startEditing} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Loader (first paint) */}
        {isHydrating ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#fff",
            }}
          >
            <ActivityIndicator size="large" color="#E9435E" />
            <Text style={{ marginTop: 8 }}>Loading meeting...</Text>
          </View>
        ) : (
          <>
            {/* Content */}
            <Pressable style={styles.content}>
              <ScrollView
                ref={scrollRef}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 120 }}
              >
                {/* Title */}
                <View style={styles.group} onLayout={storePos("title")}>
                  <View style={styles.row}>
                    <View style={styles.iconBox}>
                      <Ionicons name="pencil" size={18} color="#888" />
                    </View>
                    {editing ? (
                      <TextInput
                        style={styles.input}
                        placeholder="Add a title"
                        placeholderTextColor="#999"
                        value={title}
                        onChangeText={setTitle}
                        onFocus={() => scrollTo("title")}
                      />
                    ) : (
                      <Text style={styles.valueText}>
                        {meeting?.title || "—"}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Location */}
                <View style={styles.group} onLayout={storePos("location")}>
                  <View style={styles.row}>
                    <View style={styles.iconBox}>
                      <Ionicons name="location-outline" size={18} color="#888" />
                    </View>
                    {editing ? (
                      <TextInput
                        style={styles.input}
                        placeholder="Location"
                        placeholderTextColor="#999"
                        value={location}
                        onChangeText={setLocation}
                        onFocus={() => scrollTo("location")}
                      />
                    ) : (
                      <Text style={styles.valueText}>
                        {meeting?.location || "—"}
                      </Text>
                    )}
                  </View>
                </View>

                {/* All-day & times */}
                <View style={styles.group}>
                  <View style={styles.rowBetween}>
                    <View style={styles.rowLeft}>
                      <View className="iconBox">
                        <Ionicons name="time-outline" size={18} color="#888" />
                      </View>
                      <Text style={styles.rowLabel}>All day</Text>
                    </View>
                    {editing ? (
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
                          }
                        }}
                      />
                    ) : (
                      <Text style={styles.valueText}>
                        {meeting?.isAllDay ? "Yes" : "No"}
                      </Text>
                    )}
                  </View>

                  {!allDay && (
                    <>
                      <View style={styles.rowBetween}>
                        <Text style={[styles.rowLabel, { marginLeft: 44 }]}>
                          Start
                        </Text>
                        <Text style={styles.trailing}>
                          {editing ? (
                            <Text
                              onPress={() => setShowStartPicker(true)}
                              style={styles.linkish}
                            >
                              {fmt(start)}
                            </Text>
                          ) : (
                            fmt(start)
                          )}
                        </Text>
                      </View>

                      <View style={[styles.rowBetween, { borderBottomWidth: 0 }]}>
                        <Text style={[styles.rowLabel, { marginLeft: 44 }]}>
                          End
                        </Text>
                        <Text style={styles.trailing}>
                          {editing ? (
                            <Text
                              onPress={() => setShowEndPicker(true)}
                              style={styles.linkish}
                            >
                              {fmt(end)}
                            </Text>
                          ) : (
                            fmt(end)
                          )}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Participants */}
                <View style={styles.group}>
                  <TouchableOpacity
                    style={styles.rowBetween}
                    onPress={() => editing && setParticipantsVisible(true)}
                    disabled={!editing}
                  >
                    <View style={styles.rowLeft}>
                      <View style={styles.iconBox}>
                        <Ionicons name="person-add-outline" size={18} color="#888" />
                      </View>
                      <Text style={styles.rowLabel}>Participants</Text>
                    </View>
                    {participants.length > 0 ? (
                      <Text style={styles.trailing}>
                        {participants.length} selected
                      </Text>
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    )}
                  </TouchableOpacity>
                </View>

                {participants.length > 0 && (
                  <View style={styles.group}>
                    {participants.map((email) => (
                      <View key={email} style={styles.rowStatic}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {email[0]?.toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.primary}>{email}</Text>
                          <Text style={styles.secondary}>Attendee</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Description */}
                <View style={styles.group} onLayout={storePos("description")}>
                  <View style={[styles.row, { borderBottomWidth: 0 }]}>
                    <View style={styles.iconBox}>
                      <Ionicons
                        name="document-text-outline"
                        size={18}
                        color="#888"
                      />
                    </View>
                    {editing ? (
                      <TextInput
                        style={[styles.input, { height: 120, textAlignVertical: "top" }]}
                        placeholder="Description"
                        placeholderTextColor="#999"
                        value={description}
                        onChangeText={setDescription}
                        onFocus={() => scrollTo("description")}
                        multiline
                      />
                    ) : (
                      <Text style={styles.valueText}>
                        {meeting?.description || "—"}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Reminders */}
                <View style={styles.group}>
                  <View style={styles.row}>
                    <View style={styles.iconBox}>
                      <Ionicons name="notifications-outline" size={18} color="#888" />
                    </View>
                    {editing ? (
                      <TextInput
                        style={styles.input}
                        placeholder="Reminders (comma separated, eg 10,30,60)"
                        placeholderTextColor="#999"
                        value={reminders.join(",")}
                        onChangeText={(text) =>
                          setReminders(
                            text
                              .split(",")
                              .map((n) => parseInt(n.trim()))
                              .filter((n) => !isNaN(n))
                          )
                        }
                      />
                    ) : (
                      <Text style={styles.valueText}>
                        {reminders.length ? reminders.join(", ") : "—"}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Recurrence */}
                <View style={styles.group}>
                  <View style={styles.row}>
                    <View style={styles.iconBox}>
                      <Ionicons name="repeat-outline" size={18} color="#888" />
                    </View>
                    {editing ? (
                      <TextInput
                        style={styles.input}
                        placeholder="Recurrence rule (eg FREQ=WEEKLY;BYDAY=MO)"
                        placeholderTextColor="#999"
                        value={recurrenceRule}
                        onChangeText={setRecurrenceRule}
                      />
                    ) : (
                      <Text style={styles.valueText}>
                        {recurrenceRule || "—"}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Zoom link */}
                {meeting?.joinUrl ? (
                  <View style={styles.group}>
                    <TouchableOpacity
                      style={[styles.row, { borderBottomWidth: 0 }]}
                      onPress={() => Linking.openURL(meeting.joinUrl!)}
                    >
                      <View style={styles.iconBox}>
                        <Ionicons name="videocam-outline" size={18} color="#888" />
                      </View>
                      <Text style={[styles.rowLabel, { color: "#2563eb" }]}>
                        Join Zoom
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Meta */}
                <View style={styles.group}>
                  <View style={styles.row}>
                    <View style={styles.iconBox}>
                      <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color="#888"
                      />
                    </View>
                    <Text style={styles.secondary}>
                      Created: {meeting?.createdAt ?? "—"}
                    </Text>
                  </View>
                  <View style={[styles.row, { borderBottomWidth: 0 }]}>
                    <View style={styles.iconBox}>
                      <Ionicons name="refresh-outline" size={18} color="#888" />
                    </View>
                    <Text style={styles.secondary}>
                      Updated: {meeting?.updatedAt ?? "—"}
                    </Text>
                  </View>
                </View>

                {loadingFresh && (
                  <View style={{ padding: 12, alignItems: "center" }}>
                    <ActivityIndicator size="small" color="#E9435E" />
                    <Text style={{ marginTop: 6, color: "#888" }}>
                      Refreshing…
                    </Text>
                  </View>
                )}
              </ScrollView>
            </Pressable>

            {/* Pickers */}
            {editing && !allDay && (
              <>
                <TimeSheet
                  visible={showStartPicker}
                  title="Pick start time"
                  initial={start}
                  onPick={(d) => {
                    setStart(d);
                    if (end <= d)
                      setEnd(new Date(d.getTime() + 30 * 60 * 1000));
                  }}
                  onClose={() => setShowStartPicker(false)}
                />

                <TimeSheet
                  visible={showEndPicker}
                  title="Pick end time"
                  initial={end}
                  minimumDate={start}
                  quickFrom={start}
                  onPick={setEnd}
                  onClose={() => setShowEndPicker(false)}
                />
              </>
            )}

            {/* Inline participant picker */}
            {editing && participantsVisible && (
              <View style={styles.partOverlay}>
                <View style={styles.partSheet}>
                  <ParticipantPicker
                    onClose={() => setParticipantsVisible(false)}
                    initialSelected={participants}
                    onSubmit={(emails: string[]) => {
                      setParticipants(emails);
                      setParticipantsVisible(false);
                    }}
                  />
                </View>
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  </Modal>
);
}

export default MeetingDetails;