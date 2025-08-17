import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import MeetingCard from './MeetingCard';

type CalendarAgendaProps = {
  items: { [date: string]: any[] }; 
  selectedDate: string;
  onDayChange: (date: string) => void;
};

const CalendarAgenda = ({ items, selectedDate, onDayChange }: CalendarAgendaProps) => {
  const markedDates = {
    ...Object.keys(items).reduce((acc, date) => {
      acc[date] = {
        marked: items[date].length > 0,
        dotColor: '#2563eb',
      };
      return acc;
    }, {} as Record<string, any>),
    [selectedDate]: {
      ...(items[selectedDate]?.length ? { marked: true, dotColor: '#fff' } : {}),
      selected: true,
      selectedColor: '#2563eb',
    },
  };

  return (
    <View style={{ flex: 1 }}>
      <Calendar
        current={selectedDate}
        onDayPress={(day) => onDayChange(day.dateString)}
        markedDates={markedDates}
        enableSwipeMonths={true}
        theme={{
          selectedDayBackgroundColor: '#2563eb',
          todayTextColor: '#2563eb',
          dotColor: '#2563eb',
          selectedDotColor: '#fff',
        }}
      />

      <ScrollView contentContainerStyle={styles.agendaContainer}>
        {items[selectedDate]?.length ? (
          items[selectedDate].map((meeting, idx) => (
            <MeetingCard key={idx} meeting={meeting} />
          ))
        ) : (
          <View style={styles.empty}>
            <Text>No meetings.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  agendaContainer: {
    padding: 16,
  },
  empty: {
    padding: 16,
    alignItems: 'center',
  },
});

export default CalendarAgenda;
