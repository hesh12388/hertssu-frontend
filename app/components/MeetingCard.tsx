import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Meeting } from '../../types/meeting';

type Props = {
  meeting: Meeting;
};

const MeetingCard = ({ meeting }: Props) => {
  const start = meeting.startTime;
  const end = meeting.endTime;

  // Duration in minutes (if both times are in "HH:mm" format)
  const durationMinutes = start && end
    ? Math.max(
        0,
        new Date(`1970-01-01T${end}:00Z`).getTime() -
          new Date(`1970-01-01T${start}:00Z`).getTime()
      ) / 60000
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{start}</Text>
      <View style={styles.line} />
      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{meeting.title}</Text>
        </View>
        <Text style={styles.subtitle}>{meeting.notes || 'Meeting'}</Text>
        {durationMinutes !== null && (
          <Text style={styles.duration}>{durationMinutes} min</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    backgroundColor: '#000',
  },
  time: {
    color: '#e5e7eb',
    fontSize: 16,
    width: 52,
    fontWeight: '600',
  },
  line: {
    width: 4,
    height: 40,
    backgroundColor: '#6366f1',
    borderRadius: 4,
    marginHorizontal: 8,
    marginTop: 4,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
  },
  repeat: {
    color: '#a5b4fc',
    fontSize: 16,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
  },
  duration: {
    marginTop: 4,
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default MeetingCard;
