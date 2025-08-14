import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity
} from 'react-native';

type Props = {
  agendaItems: { [date: string]: any[] };
  selectedDate: string;
  onSelect: (date: string) => void;
};

const HorizontalDayScroller: React.FC<Props> = ({ agendaItems, selectedDate, onSelect }) => {
  const upcomingDates = Object.keys(agendaItems).sort();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      {upcomingDates.map(date => (
        <TouchableOpacity key={date} onPress={() => onSelect(date)} style={[
          styles.dayBox,
          selectedDate === date && styles.selectedBox,
        ]}>
          <Text style={styles.dateText}>{date}</Text>
          <Text style={styles.count}>{agendaItems[date].length} meeting(s)</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingVertical: 8, paddingHorizontal: 12 },
  dayBox: {
    marginRight: 10,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  selectedBox: {
    backgroundColor: '#2563eb',
  },
  dateText: {
    fontWeight: 'bold',
    color: '#111',
  },
  count: {
    fontSize: 12,
    color: '#555',
  },
});

export default HorizontalDayScroller;
