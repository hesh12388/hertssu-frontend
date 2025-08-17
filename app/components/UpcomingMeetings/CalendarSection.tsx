// components/MeetingCalendarSection.tsx
import React from 'react';
import { CalendarList } from 'react-native-calendars';

type Props = {
  selectedDate: string;
  markedDates: Record<string, any>;
  onDateSelect: (date: string) => void;
};

const MeetingCalendarSection = ({ selectedDate, markedDates, onDateSelect }: Props) => {
  return (
    <CalendarList
      key={selectedDate}
      current={selectedDate}
      onDayPress={(day: { dateString: string }) => onDateSelect(day.dateString)}
      pastScrollRange={12}
      futureScrollRange={12}
      scrollEnabled={true}
      showScrollIndicator={false}
      markedDates={markedDates}
      theme={{
        selectedDayBackgroundColor: '#2563eb',
        todayTextColor: '#2563eb',
        dotColor: '#2563eb',
        selectedDotColor: '#fff',
      }}
    />
  );
};

export default MeetingCalendarSection;
