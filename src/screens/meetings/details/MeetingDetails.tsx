import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../../App";
import {
  fetchMeetingSWRCached,
  primeMeetingCache,
} from "../../../../services/meetingDetailsCache";
import {
  deleteMeeting,
  updateMeeting,
  updateMeetingSeries,
} from "../../../../services/meetingServices";
import type {
  CreateMeetingPayload,
  MeetingResponseDto,
} from "../../../../types/meeting";

import InfoForm from "../../../components/meetings/InfoForm";
import MetaBlock from "../../../components/meetings/MetaBlock";
import ParticipantsOverlay from "../../../components/meetings/ParticipantsOverlay";
import MeetingNotesTab from "../details/MeetingNotesTab";
import MeetingPerformanceTab from "../details/MeetingPerformanceTab";

type Props = {
  visible: boolean;
  onClose: () => void;
  meetingId: number | null;
  seed?: Partial<MeetingResponseDto>;
  onUpdated?: (updated: MeetingResponseDto) => void;
  onDeleted?: () => void;
};

type TabKey = "INFO" | "NOTES" | "PERF";

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

  const [meeting, setMeeting] = useState<MeetingResponseDto | null>(null);
  const [loadingFresh, setLoadingFresh] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [participantsVisible, setParticipantsVisible] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);

  const [tab, setTab] = useState<TabKey>("INFO");

  useEffect(() => {
    if (!api || !visible || !meetingId) return;
    let cancelled = false;
    const hydrate = async () => {
      setLoadingFresh(true);
      try {
        await fetchMeetingSWRCached(
          api,
          meetingId,
          (m) => {
            if (cancelled) return;
            setMeeting(m);
            setParticipants(m?.participantEmails ?? []);
          },
          seed
        );
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
    if (meeting) {
      primeMeetingCache(meeting);
      setMeeting({ ...meeting });
      setParticipants(meeting.participantEmails ?? []);
    }
  };

  const handleSaveInfo = async (payload: CreateMeetingPayload) => {
    if (!api || !meeting) return;

    if (meeting.recurrenceId && meeting.recurrenceRule) {
      Alert.alert(
        "Update Recurring Meeting",
        "Update this occurrence or the entire series?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "This occurrence",
            onPress: async () => {
              try {
                setSaving(true);
                const updated = await updateMeeting(
                  api,
                  meeting.meetingId,
                  payload
                );
                primeMeetingCache(updated);
                setMeeting(updated);
                setParticipants(updated.participantEmails ?? []);
                setEditing(false);
                onUpdated?.(updated);
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
                await updateMeetingSeries(
                  api,
                  String(meeting.recurrenceId),
                  payload
                );

                // ✅ Re-fetch because backend returns 204
                await fetchMeetingSWRCached(api, meeting.meetingId, (m) => {
                  setMeeting(m);
                  setParticipants(m?.participantEmails ?? []);
                  primeMeetingCache(m);
                  onUpdated?.(m);
                }, seed);

                setEditing(false);
              } finally {
                setSaving(false);
              }
            },
          },
        ]
      );
      return;
    }

    // --- non recurring meeting ---
    try {
      setSaving(true);
      const updated = await updateMeeting(api, meeting.meetingId, payload);
      primeMeetingCache(updated);
      setMeeting(updated);
      setParticipants(updated.participantEmails ?? []);
      setEditing(false);
      onUpdated?.(updated);
    } finally {
      setSaving(false);
    }
  };

  const deleteById = async () => {
    if (!api || !meeting) return;
    try {
      setDeleting(true);
      await deleteMeeting(api, meeting.meetingId);
      onDeleted?.();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const deleteBySeries = async () => {
    if (!api || !meeting?.recurrenceId) return;
    try {
      setDeleting(true);
      await deleteMeeting(api, Number(meeting.recurrenceId), { series: true });
      onDeleted?.();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const onDeletePress = () => {
    if (!api || !meeting) return;
    if (meeting.recurrenceId && meeting.recurrenceRule) {
      Alert.alert(
        "Delete Recurring Meeting",
        "Delete this occurrence or the entire series?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "This occurrence", style: "destructive", onPress: deleteById },
          { text: "Entire series", style: "destructive", onPress: deleteBySeries },
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
  const isHydrating = !meeting;

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
              {tab === "INFO"
                ? editing
                  ? "Edit Event"
                  : "Event Details"
                : tab === "NOTES"
                ? "Notes"
                : "Performance"}
            </Text>

            {tab === "INFO" ? (
              editing ? (
                <TouchableOpacity
                  onPress={() => (InfoForm as any).emitSave?.()}
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
              )
            ) : (
              <View style={{ width: 72 }} />
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TabBtn
              active={tab === "INFO"}
              onPress={() => setTab("INFO")}
              label="Info"
            />
            <TabBtn
              active={tab === "NOTES"}
              onPress={() => setTab("NOTES")}
              label="Notes"
            />
            <TabBtn
              active={tab === "PERF"}
              onPress={() => setTab("PERF")}
              label="Performance"
            />
          </View>

          {/* Body */}
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
              <Pressable style={styles.content}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 120 }}
                >
                  {tab === "INFO" && (
                    <>
                      <InfoForm
                        meeting={meeting!}
                        participants={participants}
                        setParticipants={setParticipants}
                        editing={editing}
                        onCancelEdit={stopEditing}
                        onSave={handleSaveInfo}
                        onDeletePress={onDeletePress}
                        saving={saving}
                        deleting={deleting}
                        openParticipants={() => setParticipantsVisible(true)}
                      />
                      <MetaBlock
                        meeting={meeting!}
                        loadingFresh={loadingFresh}
                      />
                    </>
                  )}

                  {tab === "NOTES" && (
                    <MeetingNotesTab meetingId={meeting!.meetingId} />
                  )}

                  {tab === "PERF" && (
                    <MeetingPerformanceTab
                      meetingId={meeting.meetingId}
                      participants={(meeting.participants ?? []).map((p) => ({
                        id: p.id,
                        email: p.email,
                        firstName: p.firstName ?? "",
                        lastName: p.lastName ?? "",
                      }))}
                    />
                  )}
                </ScrollView>
              </Pressable>

              {/* Participants picker overlay */}
              {editing && participantsVisible && (
                <ParticipantsOverlay
                  visible={participantsVisible}
                  initialSelected={participants}
                  onClose={() => setParticipantsVisible(false)}
                  onSubmit={(emails) => {
                    setParticipants(emails);
                    setParticipantsVisible(false);
                  }}
                />
              )}
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const TabBtn = ({
  active,
  onPress,
  label,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.tabBtn, active && styles.tabBtnActive]}
  >
    <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
  </TouchableOpacity>
);

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
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#E9435E",
  },
  headerBtnText: { color: "#fff", fontWeight: "700" },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabBtnActive: { borderBottomWidth: 2, borderColor: "#E9435E" },
  tabText: { color: "#666", fontWeight: "600" },
  tabTextActive: { color: "#E9435E" },

  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
});

export default MeetingDetails;
