import { StatusMessage } from "@/src/components/StatusMessage";
import { useMeetingEvaluations } from "@/src/hooks/useMeetingEvaluations";
import { UpdateEvaluationPayload } from "@/src/types/meeting";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../../App";

type ParticipantLite = { id?: number; email: string; firstName: string; lastName: string };

type ParticipantData = {
  key: string;
  participantId?: number;
  evaluationId?: number;
  performance: number;
  attended: boolean;
  note: string;
  late: boolean;
  hasException: boolean;
  dirty?: boolean;
};

const FiveStars = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <View style={{ flexDirection: "row" }}>
      {stars.map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          style={{ paddingHorizontal: 2, paddingVertical: 2 }}
        >
          <Ionicons
            name={n <= value ? "star" : "star-outline"}
            size={22}
            color="#E9435E"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};
const pKey = (p: ParticipantLite) => (p.id != null ? `id:${p.id}` : `email:${p.email}`);
const getUid = (e: any) => e?.user?.id ?? e?.user?.userId ?? e?.userId ?? null;

const MeetingPerformanceTab = ({
  meetingId,
  participants,
}: {
  meetingId: number;
  participants: ParticipantLite[];
}) => {
  const { api } = useAuth() ?? {};
  const { data: evals, isLoading, isError, error, create, update, remove } =
    useMeetingEvaluations(api ?? null, meetingId);

  const [dataByKey, setDataByKey] = useState<Record<string, ParticipantData>>({});

  // loading banner for any pending mutation
  const anySaving = create.isPending || update.isPending || remove.isPending;

  // Map evals by user id
  const evalByUserId = useMemo(() => {
    const m = new Map<number, any>();
    for (const e of evals ?? []) {
      const uid = getUid(e);
      if (uid != null) m.set(Number(uid), e);
    }
    return m;
  }, [evals]);

  // Seed or merge without clobbering dirty rows, drop removed participants
  useEffect(() => {
    setDataByKey((prev) => {
      const next: Record<string, ParticipantData> = {};
      for (const p of participants) {
        const key = pKey(p);
        const prevRow = prev[key];
        const ev = p.id != null ? evalByUserId.get(Number(p.id)) : undefined;

        if (!prevRow) {
          next[key] = ev
            ? {
                key,
                participantId: getUid(ev),
                evaluationId: ev.evaluationId,
                performance: ev.performance,
                attended: ev.attended,
                note: ev.note ?? "",
                late: ev.late ?? false,
                hasException: ev.hasException ?? false,
                dirty: false,
              }
            : {
                key,
                participantId: p.id,
                performance: 1,
                attended: false,
                note: "",
                late: false,
                hasException: false,
                dirty: false,
              };
        } else if (prevRow.dirty) {
          next[key] = prevRow;
        } else if (ev) {
          next[key] = {
            ...prevRow,
            participantId: getUid(ev),
            evaluationId: ev.evaluationId,
            performance: ev.performance,
            attended: ev.attended,
            note: ev.note ?? "",
            late: ev.late ?? false,
            hasException: ev.hasException ?? false,
            dirty: false,
          };
        } else {
          next[key] = prevRow;
        }
      }
      return next;
    });
  }, [participants, evalByUserId]);

  const ensure = (p: ParticipantLite): ParticipantData => {
    const key = pKey(p);
    const existing = dataByKey[key];
    if (existing) return existing;
    const fallback: ParticipantData = {
      key,
      participantId: p.id,
      performance: 1,
      attended: false,
      note: "",
      late: false,
      hasException: false,
      dirty: false,
    };
    setDataByKey((prev) => (prev[key] ? prev : { ...prev, [key]: fallback }));
    return fallback;
  };

  const markAndSet = (key: string, patch: Partial<ParticipantData>) => {
    setDataByKey((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as ParticipantData), ...patch, dirty: true },
    }));
  };

  const updateOne = (
    key: string,
    field: keyof Omit<ParticipantData, "key" | "participantId" | "evaluationId" | "dirty">,
    value: any
  ) => {
    markAndSet(key, { [field]: value } as Partial<ParticipantData>);
  };

  const saveOne = async (p: ParticipantLite) => {
    const key = pKey(p);
    const d = dataByKey[key] ?? ensure(p);

    try {
      if (d.evaluationId) {
        const body: UpdateEvaluationPayload = {
          performance: d.performance,
          attended: d.attended,
          note: d.note,
          late: d.late,
          hasException: d.hasException,
        };
        const updated = await update.mutateAsync({ evaluationId: d.evaluationId, meetingId, body });
        setDataByKey((prev) => ({
          ...prev,
          [key]: {
            ...(prev[key] as ParticipantData),
            evaluationId: updated.evaluationId,
            performance: updated.performance,
            attended: updated.attended,
            note: updated.note ?? "",
            late: updated.late ?? false,
            hasException: updated.hasException ?? false,
            dirty: false,
          },
        }));
      } else {
        if (d.participantId == null) {
          console.warn("Missing participantId to create evaluation for", p.email);
          return;
        }
        const created = await create.mutateAsync({
          meetingId,
          userId: d.participantId,
          performance: d.performance,
          attended: d.attended,
          note: d.note,
          late: d.late,
          hasException: d.hasException,
        });
        const createdUid = getUid(created);
        setDataByKey((prev) => ({
          ...prev,
          [key]: {
            ...(prev[key] as ParticipantData),
            participantId: createdUid != null ? Number(createdUid) : prev[key]?.participantId,
            evaluationId: created.evaluationId,
            performance: created.performance,
            attended: created.attended,
            note: created.note ?? "",
            late: created.late ?? false,
            hasException: created.hasException ?? false,
            dirty: false,
          },
        }));
      }
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  const clearOne = async (p: ParticipantLite) => {
    const key = pKey(p);
    const d = dataByKey[key];
    try {
      if (d?.evaluationId) {
        await remove.mutateAsync({ meetingId, evaluationId: d.evaluationId });
      }
      setDataByKey((prev) => ({
        ...prev,
        [key]: {
          key,
          participantId: p.id,
          performance: 1,
          attended: false,
          note: "",
          late: false,
          hasException: false,
          dirty: false,
        },
      }));
    } catch (e) {
      console.error("Clear failed", e);
    }
  };

  if (isLoading) return <StatusMessage isLoading loadingMessage="Loading evaluations..." />;

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={{ color: "red" }}>
          Error loading data. Please try again later. isError: {JSON.stringify(error)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* top loading banner while saving or deleting */}
      {anySaving && <StatusMessage isLoading loadingMessage="Saving changes..." />}

      <View style={styles.inner}>
        {participants.map((p) => {
          const key = pKey(p);
          const d = ensure(p);
          return (
            <View key={`card-${key}`} style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{p.firstName?.[0]?.toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.nameText}>{`${p.firstName} ${p.lastName}`}</Text>
                  <Text style={styles.emailText}>{p.email}</Text>
                </View>
              </View>

              <View style={styles.criteriaRow}>
                <Text style={styles.criteriaLabel}>Performance 1-5</Text>
                <FiveStars value={d.performance} onChange={(v) => updateOne(key, "performance", v)} />
              </View>

              <View style={styles.criteriaRow}>
                <Text style={styles.criteriaLabel}>Attended</Text>
                <Switch value={d.attended} onValueChange={(v) => updateOne(key, "attended", v)} />
              </View>

              <View style={styles.criteriaRow}>
                <Text style={styles.criteriaLabel}>Late</Text>
                <Switch value={d.late} onValueChange={(v) => updateOne(key, "late", v)} />
              </View>

              <View style={styles.criteriaRow}>
                <Text style={styles.criteriaLabel}>Has Exception</Text>
                <Switch value={d.hasException} onValueChange={(v) => updateOne(key, "hasException", v)} />
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={[styles.criteriaLabel, { marginBottom: 6 }]}>Note</Text>
                <TextInput
                  value={d.note}
                  onChangeText={(t) => updateOne(key, "note", t)}
                  placeholder="Enter a note"
                  placeholderTextColor="#999"
                  style={styles.noteInput}
                  multiline
                  maxLength={500}
                />
              </View>

              <View style={styles.actions}>
                {create.isPending || update.isPending || remove.isPending ? (
                  <ActivityIndicator color="#E9435E" />
                ) : (
                  <>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: "#10b981" }]} onPress={() => saveOne(p)}>
                      <Text style={styles.btnText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: "#ef4444" }]} onPress={() => clearOne(p)}>
                      <Text style={styles.btnText}>Clear</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {d.dirty && <Text style={{ marginTop: 6, fontSize: 11, color: "#a16207" }}>Unsaved changes</Text>}
            </View>
          );
        })}

        {participants.length === 0 && (
          <View style={{ alignItems: "center", padding: 24 }}>
            <Text style={{ color: "#666" }}>No participants.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { height: "90%", alignItems: "center" },
  inner: { flex: 1, width: "100%", padding: 16, gap: 12 },
  errorContainer: { padding: 20, backgroundColor: "#ffebee", margin: 10, borderRadius: 8 },
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
    width: 30, height: 30, borderRadius: 15, backgroundColor: "#f0f0f0",
    alignItems: "center", justifyContent: "center", marginRight: 8,
  },
  avatarText: { color: "#444", fontWeight: "700" },
  nameText: { fontWeight: "700", color: "#111" },
  emailText: { fontSize: 12, color: "#555" },
  criteriaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 6 },
  criteriaLabel: { color: "#111" },
  noteInput: {
    minHeight: 80,
    backgroundColor: "#f7f7f7",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#111",
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "700" },
});

export default MeetingPerformanceTab;
