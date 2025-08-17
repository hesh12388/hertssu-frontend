import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Meeting } from "../../../types/meeting";

const MeetingCard = React.memo(({ meeting }: { meeting: Meeting }) => {
  return (
    <View style={styles.card}>
      {/* Top Row: Name + Status */}
      <View style={styles.header}>
        <Text style={styles.name}>{meeting.title}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>SCHEDULED</Text>
        </View>
      </View>

      {/* Role */}
      <Text style={styles.role}>
        {meeting.role || "Associate Chairperson"}
      </Text>

      {/* Department */}
      <Text style={styles.department}>
        {meeting.department || "Human Resources & Development"}
      </Text>

      {/* Date & Time */}
      <View style={styles.footer}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.dateText}>
          {meeting.date
            ? format(parseISO(meeting.date), "dd/MM/yyyy")
            : "Unknown Date"}{" "}
          • {meeting.startTime?.slice(0, 5)} - {meeting.endTime?.slice(0, 5)}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
  },
  statusBadge: {
    backgroundColor: "#E9435E",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
  role: {
    fontSize: 14,
    color: "#333",
    marginTop: 2,
  },
  department: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  dateText: {
    fontSize: 13,
    color: "#555",
    marginLeft: 4,
  },
});

export default MeetingCard;
