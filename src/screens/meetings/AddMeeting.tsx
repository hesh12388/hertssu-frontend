import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
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
import { createMeeting } from "../../../services/meetingServices";
import { CreateMeetingPayload } from "../../../types/meeting";
import TimeSheet from "../../components/TimeSheet";
import ParticipantPicker from "./ParticipantPicker";

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

const recurrenceOptions = [
  { label: "Does not repeat", value: "" },
  { label: "Daily", value: "FREQ=DAILY" },
  { label: "Weekly", value: "FREQ=WEEKLY" },
  { label: "Monthly", value: "FREQ=MONTHLY" },
  { label: "Yearly", value: "FREQ=YEARLY" },
];
const RED = "#E9435E";

const AddMeetingModal: React.FC<Props> = ({
  visible,
  onClose,
  onMeetingCreated,
  initialStart,
}) => {
  const auth = useAuth();
  const api = auth?.api;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [allDay, setAllDay] = useState(false);

  const [start, setStart] = useState<Date>(initialStart ?? new Date());
  const [end, setEnd] = useState<Date>(new Date(Date.now() + 30 * 60 * 1000));

  const [participants, setParticipants] = useState<
    { id: number; firstname?: string; lastname?: string; email: string }[]
  >([]);
  const [participantsVisible, setParticipantsVisible] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");

  const [reminders, setReminders] = useState<number[]>([30]);

  useEffect(() => {
    if (visible) {
      const base = initialStart ?? new Date();
      setStart(base);
      setEnd(new Date(base.getTime() + 30 * 60 * 1000));
    }
  }, [visible, initialStart]);

  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const storePos = (key: string) => (e: any) => {
    positions.current[key] = e.nativeEvent.layout.y;
  };
  const scrollTo = (key: string) => {
    const y = positions.current[key] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
  };

const save = async () => {
  const payload: CreateMeetingPayload = {
    title,
    description,
    location,
    date: start.toISOString().slice(0, 10),
    startTime: allDay ? "00:00" : start.toTimeString().slice(0, 5),
    endTime: allDay ? "23:59" : end.toTimeString().slice(0, 5),
    isAllDay: allDay,
    participants: participants.map((p) => p.email), 
    recurrenceRule,
    reminders: reminders,
  };

  try {
    await createMeeting(api!, payload);
    onMeetingCreated?.();
    onClose();
  } catch (e) {
    console.error("Create meeting failed:", e);
  }
};

  const organizerInitials =
    `${auth?.user?.firstname?.[0] ?? ""}${auth?.user?.lastname?.[0] ?? ""}`.toUpperCase() ||
    "US";
  const organizerName =
    [auth?.user?.firstname, auth?.user?.lastname].filter(Boolean).join(" ") ||
    auth?.user?.name ||
    "User";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Event</Text>
            <TouchableOpacity onPress={save} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          <Pressable style={styles.content}>
            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              <View style={styles.group}>
                <TouchableOpacity
                  style={styles.rowBetween}
                  onPress={() => setParticipantsVisible(true)}
                >
                  <View style={styles.rowLeft}>
                    <View style={styles.iconBox}>
                      <Ionicons
                        name="person-add-outline"
                        size={18}
                        color="#888"
                      />
                    </View>
                    <Text style={styles.rowLabel}>Add participants</Text>
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

              {participants.length > 0 && (
                <View style={styles.group}>
                  {participants.map((p) => (
                    <View key={p.email} style={styles.rowStatic}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {(p.firstname?.[0] || "").toUpperCase()}
                          {(p.lastname?.[0] || "").toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.primary}>
                          {[p.firstname, p.lastname]
                            .filter(Boolean)
                            .join(" ") || p.email}
                        </Text>
                        <Text style={styles.secondary}>{p.email}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.group}>
                <View style={styles.rowBetween}>
                  <View style={styles.rowLeft}>
                    <View style={styles.iconBox}>
                      <Ionicons name="time-outline" size={18} color="#888" />
                    </View>
                    <Text style={styles.rowLabel}>All-day</Text>
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
                      }
                    }}
                  />
                </View>

                {!allDay && (
                  <>
                    <TouchableOpacity
                      style={styles.rowBetween}
                      onPress={() => setShowStartPicker(true)}
                    >
                      <Text style={[styles.rowLabel, { marginLeft: 44 }]}>
                        Start
                      </Text>
                      <Text style={styles.trailing}>{fmt(start)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rowBetween, { borderBottomWidth: 0 }]}
                      onPress={() => setShowEndPicker(true)}
                    >
                      <Text style={[styles.rowLabel, { marginLeft: 44 }]}>
                        End
                      </Text>
                      <Text style={styles.trailing}>{fmt(end)}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={styles.group} onLayout={storePos("location")}>
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
                    onFocus={() => scrollTo("location")}
                  />
                </View>
              </View>

              <View style={styles.group} onLayout={storePos("title")}>
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
                    onFocus={() => scrollTo("title")}
                  />
                </View>
              </View>

              <View style={styles.group} onLayout={storePos("description")}>
                <View style={[styles.row, { borderBottomWidth: 0 }]}>
                  <View style={styles.iconBox}>
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color="#888"
                    />
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      { height: 120, textAlignVertical: "top" },
                    ]}
                    placeholder="Description"
                    placeholderTextColor="#999"
                    value={description}
                    onChangeText={setDescription}
                    onFocus={() => scrollTo("description")}
                    multiline
                  />
                </View>
              </View>

              <View style={styles.group}>
                <View style={styles.row}>
                  <View style={styles.iconBox}>
                    <Ionicons
                      name="notifications-outline"
                      size={18}
                      color="#888"
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Reminders (comma separated minutes, e.g. 10,30,60)"
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
                </View>
              </View>

              <View style={styles.group}>
                <View style={styles.row}>
                  <View style={styles.iconBox}>
                    <Ionicons name="repeat-outline" size={18} color="#888" />
                  </View>
                  <View style={{ flex: 1 }}>
                    {recurrenceOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setRecurrenceRule(opt.value)}
                        style={[
                          styles.rowBetween,
                          { borderBottomWidth: 0, paddingHorizontal: 0 },
                        ]}
                      >
                        <Text style={styles.rowLabel}>{opt.label}</Text>
                        {recurrenceRule === opt.value && (
                          <Ionicons name="checkmark" size={18} color={RED} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </Pressable>

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

          {participantsVisible && (
            <View style={styles.partOverlay}>
              <View style={styles.partSheet}>
                <ParticipantPicker
                  onClose={() => setParticipantsVisible(false)}
                  initialSelected={participants.map((p) => p.email)}
                  onSubmit={(emails: string[]) => {
                    setParticipants(
                      emails.map((e, i) => ({
                        id: i,
                        email: e,
                      }))
                    );
                    setParticipantsVisible(false);
                  }}
                />
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
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
  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
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
  rowStatic: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#E9435E",
  },
  headerBtnText: { color: "#fff", fontWeight: "700" },
});

export default AddMeetingModal;
