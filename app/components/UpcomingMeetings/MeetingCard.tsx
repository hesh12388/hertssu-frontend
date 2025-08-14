import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  startTime: string;
  duration: string;
  title: string;
  platform: string;
};

const MeetingCard: React.FC<Props> = ({ startTime, duration, title, platform }) => (
  <View style={styles.row}>
    <View>
      <Text style={styles.time}>{startTime}</Text>
      <Text style={styles.duration}>{duration}</Text>
    </View>
    <View style={{ flex: 1, paddingLeft: 12 }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.platform}>{platform}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  time: {
    fontSize: 16,
    fontWeight: "600",
  },
  duration: {
    fontSize: 14,
    color: "#666",
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  platform: {
    fontSize: 14,
    color: "#666",
  },
});

export default MeetingCard;
