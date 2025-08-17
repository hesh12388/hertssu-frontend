import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../../../App";
import { addMeetingNote, deleteMeetingNote, getMeetingNotes, updateMeetingNote } from "../../../../services/meetingServices";

type Note = { 
  id: string; 
  text: string; 
  createdAt?: string; 
  updatedAt?: string; 
  author: string;
};

const MeetingNotesTab = ({ meetingId }: { meetingId: number }) => {
  const auth = useAuth();
  const api = auth?.api;

  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);


  const load = async () => {
    if (!api) return;
    setLoading(true);
    try {
      const list = await getMeetingNotes(api, meetingId);
      setNotes(
        list.map((n: any) => ({
          id: n.id,
          text: n.text ?? n.note, // backend might send "text" now
          author: n.author,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        }))
      );
    } catch (e) {
      console.error("notes load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [meetingId]);

const addNote = async () => {
  if (!api || !draft.trim()) return;
  setCreating(true);
  try {
    const created = await addMeetingNote(api, meetingId, draft.trim());
    setNotes([created, ...notes]);
    setDraft("");
  } catch (e) {
    console.error("create note failed", e);
  } finally {
    setCreating(false);
  }
};

const editNote = async (note: Note, nextText: string) => {
  if (!api) return;
  setPendingIds((prev) => new Set(prev).add(note.id));
  try {
    await updateMeetingNote(api, meetingId, note.id, nextText);
    setNotes((prev) =>
      prev.map((n) =>
        n.id === note.id ? { ...n, text: nextText, updatedAt: new Date().toISOString() } : n
      )
    );
  } catch (e) {
    console.error("update note failed", e);
  } finally {
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(note.id);
      return next;
    });
  }
};

const removeNote = async (note: Note) => {
  if (!api) return;
  Alert.alert("Delete note?", "This cannot be undone.", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        setPendingIds((prev) => new Set(prev).add(note.id));
        try {
          await deleteMeetingNote(api, meetingId, note.id);
          setNotes((prev) => prev.filter((n) => n.id !== note.id));
        } catch (e) {
          console.error("delete note failed", e);
        } finally {
          setPendingIds((prev) => {
            const next = new Set(prev);
            next.delete(note.id);
            return next;
          });
        }
      },
    },
  ]);
};

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#E9435E" />
      </View>
    );
  }

  return (
    <View style={{ padding: 16 }}>
      {/* composer */}
      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a note…"
          placeholderTextColor="#999"
          style={styles.input}
          multiline
        />
        <TouchableOpacity style={styles.addBtn} onPress={addNote}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* list */}
      {notes.map((n) => (
        <NoteRow
          key={n.id}
          note={n}
          onSave={editNote}
          onDelete={removeNote}
          loading={pendingIds.has(n.id)}
        />
      ))}


      {notes.length === 0 && (
        <View style={styles.center}>
          <Text style={{ color: "#666" }}>No notes yet.</Text>
        </View>
      )}
    </View>
  );
};

const NoteRow = ({ note, onSave, onDelete, loading }: {
  note: Note;
  onSave: (note: Note, nextText: string) => void;
  onDelete: (note: Note) => void;
  loading: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [txt, setTxt] = useState(note.text);

  if (loading) {
    return (
      <View style={[styles.noteCard, { alignItems: "center" }]}>
        <ActivityIndicator color="#E9435E" />
      </View>
    );
  }

  return (
    <View style={styles.noteCard}>
      {editing ? (
        <>
          <TextInput
            value={txt}
            onChangeText={setTxt}
            style={[styles.input, { minHeight: 80 }]}
            multiline
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#10b981" }]}
              onPress={() => { onSave(note, txt); setEditing(false); }}
            >
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#6b7280" }]}
              onPress={() => { setEditing(false); setTxt(note.text); }}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={{ color: "#111", marginBottom: 6 }}>{note.text}</Text>
          <Text style={{ color: "#666", fontSize: 12, marginBottom: 8 }}>
            {note.author} • {note.updatedAt ?? note.createdAt}
          </Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="create-outline" size={16} color="#2563eb" />
              <Text style={{ color: "#2563eb" }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(note)}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={{ color: "#ef4444" }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  center: { padding: 24, alignItems: "center", justifyContent: "center" },
  composer: { flexDirection: "row", gap: 8, marginBottom: 14 },
  input: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111",
  },
  addBtn: { backgroundColor: "#E9435E", paddingHorizontal: 14, justifyContent: "center", borderRadius: 10 },
  noteCard: {
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "700" },
});

export default MeetingNotesTab;
