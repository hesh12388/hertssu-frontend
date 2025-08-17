import React from "react";
import { StyleSheet, View } from "react-native";
import ParticipantPicker from "../../screens/meetings/ParticipantPicker";

type Props = {
  visible: boolean;
  initialSelected: string[];
  onClose: () => void;
  onSubmit: (emails: string[]) => void;
};

const ParticipantsOverlay: React.FC<Props> = ({ visible, initialSelected, onClose, onSubmit }) => {
  if (!visible) return null;
  return (
    <View style={styles.partOverlay}>
      <View style={styles.partSheet}>
        <ParticipantPicker onClose={onClose} initialSelected={initialSelected} onSubmit={onSubmit} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  partOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end",
  },
  partSheet: {
    flex: 1, maxHeight: "100%", backgroundColor: "#fff",
    borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: "hidden",
  },
});

export default ParticipantsOverlay;
