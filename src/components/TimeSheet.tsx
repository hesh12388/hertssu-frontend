// TimeSheet.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const RED = "#E9435E";

type Props = {
  visible: boolean;
  title: string;
  initial: Date;
  minimumDate?: Date;
  quickFrom?: Date;
  onPick: (date: Date) => void;
  onClose: () => void;
};

export default function TimeSheet({
  visible,
  title,
  initial,
  minimumDate,
  quickFrom,
  onPick,
  onClose,
}: Props) {
  const [temp, setTemp] = useState(initial);
  const [showCustom, setShowCustom] = useState(false);

  const quickBase = (quickFrom instanceof Date ? quickFrom : undefined) ?? (initial instanceof Date ? initial : new Date());

  const quicks = [
    { label: "15 minutes", deltaMin: 15 },
    { label: "30 minutes", deltaMin: 30 },
    { label: "45 minutes", deltaMin: 45 },
    { label: "1 hour", deltaMin: 60 },
    { label: "1.5 hours", deltaMin: 90 },
    { label: "2 hours", deltaMin: 120 },
  ];

  const applyQuick = (m: number) => {
    if (!(quickBase instanceof Date)) return;
    const d = new Date(quickBase.getTime() + m * 60 * 1000);
    onPick(d);
    onClose();
  };

  const confirmCustom = () => {
    const min = minimumDate ?? new Date();
    const chosen = temp < min ? min : temp;
    onPick(chosen); 
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={confirmCustom} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {/* Quick options */}
            <View style={{ paddingVertical: 8 }}>
              {quicks.map((q) => (
                <TouchableOpacity
                  key={q.label}
                  style={styles.quickRow}
                  onPress={() => applyQuick(q.deltaMin)}
                  disabled={!(quickBase instanceof Date)}
                >
                  <Text style={styles.quickText}>{q.label}</Text>
                  <Text style={styles.quickTime}>
                    {quickBase instanceof Date
                      ? new Intl.DateTimeFormat("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(quickBase.getTime() + q.deltaMin * 60 * 1000))
                      : "--:--"}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Toggle Button for Custom Picker */}
              <TouchableOpacity
                style={[
                  styles.quickRow,
                  { borderBottomWidth: showCustom ? StyleSheet.hairlineWidth : 0 },
                ]}
                onPress={() => setShowCustom(!showCustom)}
              >
                <Text
                  style={[
                    styles.quickText,
                    { fontWeight: "700", color: RED },
                  ]}
                >
                  {showCustom ? "Hide custom date & time" : "Show custom date & time"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom Date + Time picker */}
            {showCustom && (
              <View style={styles.customWrap}>
                <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={temp}
                  mode={Platform.OS === "ios" ? "datetime" : "date"}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={minimumDate ?? new Date()}
                  onChange={(e, d) => d && setTemp(d)}
                  minuteInterval={5}
                  style={styles.picker}
                  textColor={Platform.OS === "ios" ? "#000000" : undefined}
                  themeVariant="light"
                />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  backdrop: { flex: 1 },
  sheet: {
    height: "80%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  headerTitle: { color: "#111", fontSize: 16, fontWeight: "700" },
  headerBtn: {
    backgroundColor: RED,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerBtnText: { color: "#fff", fontWeight: "700" },

  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  quickText: { color: "#111", fontSize: 16 },
  quickTime: { color: "#555", fontSize: 16 },

  customWrap: {
    paddingVertical: 16,
    alignItems: "center",
  },
  pickerContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 280,
    ...(Platform.OS === "ios" && {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  picker: {
    width: "100%",
    height: 260,
    ...(Platform.OS === "ios" && {
      backgroundColor: "#ffffff",
    }),
  },
});
