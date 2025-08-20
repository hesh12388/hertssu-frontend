import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";

const RED = "#E9435E";

type Props = {
  recurrenceUntil: string | null;
  onChangeUntil: (date: string | null) => void;
};

export default function RecurrenceUntilPicker({ recurrenceUntil, onChangeUntil }: Props) {
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <View>
      {/* Trigger row */}
      <TouchableOpacity
        onPress={() => setShowCalendar(true)}
        style={{ flexDirection: "row", justifyContent: "space-between", padding: 12 }}
      >
        <Text style={{ fontSize: 16 }}>Until</Text>
        <Text style={{ color: recurrenceUntil ? "black" : "gray" }}>
          {recurrenceUntil ?? "No end date"}
        </Text>
      </TouchableOpacity>

      {showCalendar && (
        <Calendar
          onDayPress={(day) => {
            onChangeUntil(day.dateString);
            setShowCalendar(false);
          }}
          markedDates={
            recurrenceUntil
              ? { [recurrenceUntil]: { selected: true, selectedColor: RED } }
              : {}
          }
        />
      )}
    </View>
  );
}