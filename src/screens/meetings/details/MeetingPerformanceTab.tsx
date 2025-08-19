// MeetingPerformanceTab.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../../../App";

import {
  addMeetingEvaluation,
  deleteMeetingEvaluation,
  getMeetingEvaluations,
  updateMeetingEvaluation,
} from "../../../../services/meetingServices";

type ParticipantLite = { id: number; email: string; firstName: string; lastName: string };

type EvalRow = {
  id?: string;
  participantId: number;
  participantEmail: string;
  participantName: string;
  performance: number;
  communication: number;
  teamwork: number;
  attendance: boolean;
  isLate: boolean;
};

const criterias: Array<keyof Pick<EvalRow, "performance" | "communication" | "teamwork">> = [
  "performance",
  "communication",
  "teamwork",
];

const MeetingPerformanceTab = ({
  meetingId,
  participants,
}: {
  meetingId: number;
  participants: ParticipantLite[];
}) => {
  const auth = useAuth();
  const api = auth?.api;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Record<number, EvalRow>>({});

  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

  const load = async () => {
    if (!api) return;
    setLoading(true);
    try {
      const existing = await getMeetingEvaluations(api, meetingId);
      const map: Record<number, EvalRow> = {};

      existing.forEach((e: any) => {
        const p = participants.find((x) => x.id === e.participantId);
        if (!e.participantId) return;
        map[e.participantId] = {
          id: e.id,
          participantId: e.participantId,
          participantEmail: p?.email ?? "",
          participantName: p ? `${p.firstName} ${p.lastName}` : "",
          performance: e.performance ?? 0,
          communication: e.communication ?? 0,
          teamwork: e.teamwork ?? 0,
          attendance: e.attendance ?? false,
          isLate: e.isLate ?? false,
        };
      });

      participants.forEach((p) => {
        if (!map[p.id]) {
          map[p.id] = {
            participantId: p.id,
            participantEmail: p.email,
            participantName: `${p.firstName} ${p.lastName}`,
            performance: 0,
            communication: 0,
            teamwork: 0,
            attendance: false,
            isLate: false
          };
        }
      });

      setRows(map);
    } catch (e) {
      const map: Record<number, EvalRow> = {};
      participants.forEach((p) => {
        map[p.id] = {
          participantId: p.id,
          participantEmail: p.email,
          participantName: `${p.firstName} ${p.lastName}`,
          performance: 0,
          communication: 0,
          teamwork: 0,
          attendance: false,
          isLate: false,
        };
      });
      setRows(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [meetingId, JSON.stringify(participants.map((p) => p.id))]);

  const list = useMemo(
    () => participants.map((p) => rows[p.id]).filter(Boolean),
    [participants, rows]
  );

  const setVal = (participantId: number, key: keyof EvalRow, value: any) =>
    setRows((prev) => ({
      ...prev,
      [participantId]: { ...prev[participantId], [key]: value },
    }));

const saveOne = async (participantId: number) => {
  if (!api) return;
  const row = rows[participantId];
  if (!row) return;

  const body = {
    participantId: row.participantId,
    performance: row.performance,
    communication: row.communication,
    teamwork: row.teamwork,
    attendance: row.attendance,   
    isLate: row.isLate,           
  };

  setSavingIds((prev) => new Set(prev).add(participantId));
  try {
    if (row.id) {
      await updateMeetingEvaluation(api, meetingId, row.id, body);
    } else {
      await addMeetingEvaluation(api, meetingId, body);
    }
  } catch (e) {
    console.error("save evaluation failed", e);
  } finally {
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(participantId);
      return next;
    });
    load();
  }
};


const clearOne = async (participantId: number) => {
  if (!api) return;
  const existingId = rows[participantId]?.id;

  setSavingIds((prev) => new Set(prev).add(participantId));
  try {
    if (existingId) {
      await deleteMeetingEvaluation(api, meetingId, existingId);
    }
  } catch (e) {
    console.error("delete eval failed", e);
  } finally {
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(participantId);
      return next;
    });
    setRows((prev) => ({
      ...prev,
      [participantId]: {
        participantId,
        participantEmail: participants.find((p) => p.id === participantId)?.email ?? "",
        participantName: participants.find((p) => p.id === participantId)
          ? `${participants.find((p) => p.id === participantId)!.firstName} ${
              participants.find((p) => p.id === participantId)!.lastName
            }`
          : "",
        performance: 0,
        communication: 0,
        teamwork: 0,
        attendance: false,
        isLate: false,
      },
    }));
  }
};

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#E9435E" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.inner}>
        {list.map((row) => (
          <View key={`card-${row.participantId}`} style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{row.participantName?.[0]?.toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.nameText}>{row.participantName}</Text>
                <Text style={styles.emailText}>{row.participantEmail}</Text>
              </View>
            </View>

            {criterias.map((k) => (
              <View key={`crit-${row.participantId}-${k}`} style={styles.criteriaRow}>
                <Text style={styles.criteriaLabel}>{labelFor(k)}</Text>
                <Stars
                  value={row[k] as number}
                  onChange={(v) => setVal(row.participantId, k, v)}
                />
              </View>
            ))}

            <View style={styles.criteriaRow}>
              <Text style={styles.criteriaLabel}>Attendance</Text>
              <Switch
                value={row.attendance}
                onValueChange={(v) => setVal(row.participantId, "attendance", v)}
              />
            </View>
            <View style={styles.criteriaRow}>
              <Text style={styles.criteriaLabel}>Is Late</Text>
              <Switch
                value={row.isLate}
                onValueChange={(v) => setVal(row.participantId, "isLate", v)}
              />
            </View>

            <View style={styles.actions}>
              {savingIds.has(row.participantId) ? (
                <ActivityIndicator color="#E9435E" />
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#10b981" }]}
                    onPress={() => saveOne(row.participantId)}
                  >
                    <Text style={styles.btnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#ef4444" }]}
                    onPress={() => clearOne(row.participantId)}
                  >
                    <Text style={styles.btnText}>Clear</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

          </View>
        ))}

        {list.length === 0 && (
          <View style={{ alignItems: "center", padding: 24 }}>
            <Text style={{ color: "#666" }}>No participants.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const Stars = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => {
  const stars = [1, 2, 3, 4, 5] as const;
  return (
    <View style={{ flexDirection: "row" }}>
      {stars.map((n) => (
        <TouchableOpacity key={`star-${value}-${n}`} onPress={() => onChange(n)} style={{ paddingHorizontal: 2 }}>
          <Ionicons name={n <= value ? "star" : "star-outline"} size={20} color="#E9435E" />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const labelFor = (k: string) =>
  k === "performance" ? "Performance"
  : k === "communication" ? "Communication"
  : "Teamwork";

const styles = StyleSheet.create({
  wrapper: { height: "90%", alignItems: "center" },
  inner: { flex: 1, width: "100%", padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarText: { color: "#444", fontWeight: "700" },
  nameText: { fontWeight: "700", color: "#111" },
  emailText: { fontSize: 12, color: "#555" },
  criteriaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  criteriaLabel: { color: "#111" },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "700" },
});

export default MeetingPerformanceTab;
