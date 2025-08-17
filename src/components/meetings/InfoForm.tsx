import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { CreateMeetingPayload, MeetingResponseDto } from "../../../types/meeting";
import TimeSheet from "../TimeSheet";

const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

const pad = (n: number) => String(n).padStart(2, "0");
const toHHmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parseTime = (t?: string | null) => {
  if (!t) return { h: 0, m: 0 };
  const [hh, mm] = (t || "").split(":");
  return { h: Number(hh || 0), m: Number(mm || 0) };
};

type Props = {
  meeting: MeetingResponseDto;
  participants: string[];
  setParticipants: (emails: string[]) => void;

  editing: boolean;
  onCancelEdit: () => void;
  onSave: (payload: CreateMeetingPayload) => void;
  onDeletePress: () => void;

  saving: boolean;
  deleting: boolean;

  openParticipants: () => void;
};

// tiny bridge so parent header can press "Save"
let _saveHook: (() => void) | null = null;
const emitSave = () => _saveHook?.();

const InfoForm: React.FC<Props> & { emitSave?: () => void } = ({
  meeting,
  participants,
  setParticipants,
  editing,
  onCancelEdit,
  onSave,
  onDeletePress,
  saving,
  deleting,
  openParticipants,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState<Date>(new Date());
  const [end, setEnd] = useState<Date>(new Date(Date.now() + 30 * 60 * 1000));
  const [recurrenceRule, setRecurrenceRule] = useState<string>("");
  const [reminders, setReminders] = useState<number[]>([]);

  // modal state for time pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    setTitle(meeting.title ?? "");
    setDescription(meeting.description ?? "");
    setLocation(meeting.location ?? "");
    setAllDay(!!meeting.isAllDay);
    setRecurrenceRule(meeting.recurrenceRule ?? "");
    setReminders(meeting.reminders ?? []);

    const base = new Date(`${meeting.date}T00:00:00`);
    if (meeting.isAllDay) {
      const s = new Date(base); s.setHours(0, 0, 0, 0);
      const e = new Date(base); e.setHours(23, 59, 0, 0);
      setStart(s); setEnd(e);
    } else {
      const { h: sh, m: sm } = parseTime(meeting.startTime);
      const { h: eh, m: em } = parseTime(meeting.endTime);
      const s = new Date(base); s.setHours(sh, sm, 0, 0);
      const e = new Date(base); e.setHours(eh, em, 0, 0);
      setStart(s); setEnd(e);
    }
  }, [meeting]);

  const payload: CreateMeetingPayload = useMemo(
    () => ({
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
    }),
    [title, description, location, start, end, allDay, participants, recurrenceRule, reminders]
  );

  // expose the save handler to parent header
  useEffect(() => {
    _saveHook = () => onSave(payload);
    return () => { if (_saveHook) _saveHook = null; };
  }, [payload, onSave]);

  const canEditTimes = editing && !allDay;

  return (
    <View>
      {/* Title */}
      <Row>
        <Icon name="pencil" />
        {editing ? (
          <Input value={title} onChangeText={setTitle} placeholder="Add a title" />
        ) : (
          <Value>{title || "-"}</Value>
        )}
      </Row>

      {/* Location */}
      <Row>
        <Icon name="location-outline" />
        {editing ? (
          <Input value={location} onChangeText={setLocation} placeholder="Location" />
        ) : (
          <Value>{location || "-"}</Value>
        )}
      </Row>

      {/* All-day (external toggle) */}
      <Group>
        <RowBetween>
          <Left>
            <Icon name="time-outline" />
            <Text style={styles.rowLabel}>All day</Text>
          </Left>
          {editing ? (
            <Switch
              value={allDay}
              onValueChange={(v) => {
                setAllDay(v);
                if (v) {
                  const s = new Date(start); s.setHours(0, 0, 0, 0);
                  const e = new Date(start); e.setHours(23, 59, 0, 0);
                  setStart(s); setEnd(e);
                } else {
                  if (end <= start) setEnd(new Date(start.getTime() + 30 * 60000));
                }
              }}
            />
          ) : (
            <Value>{allDay ? "Yes" : "No"}</Value>
          )}
        </RowBetween>

        {/* Start/End rows (press to open modal only when editing and not all-day) */}
        <RowBetween>
          <Text style={[styles.rowLabel, { marginLeft: 44 }]}>Start</Text>
          {canEditTimes ? (
            <TouchableOpacity onPress={() => setShowStartPicker(true)}>
              <Text style={styles.trailing}>{fmt(start)}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.trailing}>{fmt(start)}</Text>
          )}
        </RowBetween>

        <RowBetween style={{ borderBottomWidth: 0 }}>
          <Text style={[styles.rowLabel, { marginLeft: 44 }]}>End</Text>
          {canEditTimes ? (
            <TouchableOpacity onPress={() => setShowEndPicker(true)}>
              <Text style={styles.trailing}>{fmt(end)}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.trailing}>{fmt(end)}</Text>
          )}
        </RowBetween>

        {/* Start picker modal */}
        <TimeSheet
          visible={showStartPicker}
          title="Pick start"
          initial={start}
          minimumDate={new Date(`${meeting.date}T00:00:00`)}
          quickFrom={start}
          onPick={(d) => {
            setStart(d);
            if (d >= end) setEnd(new Date(d.getTime() + 30 * 60000));
          }}
          onClose={() => setShowStartPicker(false)}
        />

        {/* End picker modal */}
        <TimeSheet
          visible={showEndPicker}
          title="Pick end"
          initial={end}
          minimumDate={start}
          quickFrom={start}
          onPick={(d) => setEnd(d)}
          onClose={() => setShowEndPicker(false)}
        />
      </Group>

      {/* Participants (opens overlay) */}
      <Group>
        <TouchableOpacity style={styles.rowBetween} onPress={editing ? openParticipants : undefined} disabled={!editing}>
          <Left>
            <Icon name="person-add-outline" />
            <Text style={styles.rowLabel}>Participants</Text>
          </Left>
          {participants.length > 0 ? (
            <Text style={styles.trailing}>{participants.length} selected</Text>
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#999" />
          )}
        </TouchableOpacity>
      </Group>

      {/* List of participants */}
      {participants.length > 0 && (
        <Group>
          {participants.map((email) => (
            <View key={email} style={styles.rowStatic}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{email[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.primary}>{email}</Text>
                <Text style={styles.secondary}>Attendee</Text>
              </View>
            </View>
          ))}
        </Group>
      )}

      {/* Description */}
      <Group>
        <Row style={{ borderBottomWidth: 0 }}>
          <Icon name="document-text-outline" />
          {editing ? (
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              multiline
              style={{ height: 120, textAlignVertical: "top" }}
            />
          ) : (
            <Value>{description || "-"}</Value>
          )}
        </Row>
      </Group>

      {/* Reminders */}
      <Row>
        <Icon name="notifications-outline" />
        {editing ? (
          <Input
            value={reminders.join(",")}
            onChangeText={(text) =>
              setReminders(
                text
                  .split(",")
                  .map((n) => parseInt(n.trim(), 10))
                  .filter((n) => !Number.isNaN(n))
              )
            }
            placeholder="Reminders (comma separated, eg 10,30,60)"
          />
        ) : (
          <Value>{reminders.length ? reminders.join(", ") : "-"}</Value>
        )}
      </Row>

      {/* Recurrence */}
      <Row>
        <Icon name="repeat-outline" />
        {editing ? (
          <Input
            value={recurrenceRule}
            onChangeText={setRecurrenceRule}
            placeholder="Recurrence rule (eg FREQ=WEEKLY;BYDAY=MO)"
          />
        ) : (
          <Value>{recurrenceRule || "-"}</Value>
        )}
      </Row>

      {/* Zoom */}
      {meeting?.joinUrl ? (
        <Group>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => Linking.openURL(meeting.joinUrl!)}>
            <Icon name="videocam-outline" />
            <Text style={[styles.rowLabel, { color: "#2563eb" }]}>Join Zoom</Text>
          </TouchableOpacity>
        </Group>
      ) : null}

      {/* Footer actions */}
      {editing ? (
        <View style={{ padding: 16, gap: 10 }}>
          <Button bg="#10b981" onPress={() => onSave(payload)} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Save</Text>}
          </Button>
          <Button bg="#6b7280" onPress={onCancelEdit} disabled={saving}>
            <Text style={styles.actionText}>Cancel</Text>
          </Button>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          <Button bg="#ef4444" onPress={onDeletePress} disabled={deleting}>
            {deleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Delete</Text>}
          </Button>
        </View>
      )}
    </View>
  );
};

const Group = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.group}>{children}</View>
);

const Row = ({ children, style }: any) => (
  <View style={[styles.row, style]}>{children}</View>
);

const RowBetween = ({ children, style }: any) => (
  <View style={[styles.rowBetween, style]}>{children}</View>
);

const Left = ({ children }: any) => (
  <View style={{ flexDirection: "row", alignItems: "center" }}>{children}</View>
);

const Icon = ({ name }: { name: any }) => (
  <View style={styles.iconBox}>
    <Ionicons name={name} size={18} color="#888" />
  </View>
);

const Input = (props: any) => (
  <TextInput
    placeholderTextColor="#999"
    {...props}
    style={[styles.input, props.style]}
  />
);

const Value = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.valueText}>{children}</Text>
);

const Button = ({ bg, onPress, disabled, children }: any) => (
  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: bg }]} onPress={onPress} disabled={disabled}>
    {children}
  </TouchableOpacity>
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
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
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
  valueText: { fontSize: 16, color: "#111", flexShrink: 1 },
  rowLabel: { fontSize: 16, color: "#111" },
  trailing: { color: "#555", fontSize: 14 },

  rowStatic: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#eaeaea", alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  avatarText: { color: "#444", fontWeight: "700" },
  primary: { fontSize: 16, fontWeight: "700", color: "#111" },
  secondary: { fontSize: 13, color: "#6b7280", marginTop: 2 },

  actionBtn: { paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

export default InfoForm;
(InfoForm as any).emitSave = emitSave;
