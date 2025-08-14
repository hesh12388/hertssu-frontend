// components/MeetingListSection.tsx
import { format, parseISO } from 'date-fns';
import React from 'react';
import {
    SectionList,
    SectionListRenderItem,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MeetingCard from './MeetingCard';

interface Meeting {
  meetingId: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type?: string;
  notes?: string;
  creator?: {
    firstName?: string;
    lastName?: string;
  };
}

interface SectionData {
  title: string;
  data: Meeting[];
}

type Props = {
  sections: SectionData[];
  selectedDate: string;
  onScrollRef: React.RefObject<SectionList<any>>;
  onDateUpdate: (date: string) => void;
  isAutoScrolling: React.MutableRefObject<boolean>;
  isManualScrolling: React.MutableRefObject<boolean>;
};

const MeetingListSection = ({
  sections,
  selectedDate,
  onScrollRef,
  onDateUpdate,
  isAutoScrolling,
  isManualScrolling,
}: Props) => {
  const renderItem: SectionListRenderItem<Meeting, SectionData> = ({ item, section }) => {
    if (item.meetingId === -1) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No meetings scheduled</Text>
        </View>
      );
    }
    return <MeetingCard meeting={item} />;
  };

  return (
    <SectionList
      ref={onScrollRef}
      sections={sections}
      keyExtractor={(item) => item.meetingId?.toString()}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>
          {format(parseISO(section.title), 'EEEE, MMM d')}
        </Text>
      )}
      renderItem={renderItem}
      onScrollBeginDrag={() => (isManualScrolling.current = true)}
      onScrollEndDrag={() => setTimeout(() => (isManualScrolling.current = false), 100)}
      onViewableItemsChanged={({ viewableItems }) => {
        if (isAutoScrolling.current || isManualScrolling.current) return;
        const first = viewableItems.find((vi) => vi.section);
        if (first?.section?.title && first.section.title !== selectedDate) {
          onDateUpdate(first.section.title);
        }
      }}
      viewabilityConfig={{ itemVisiblePercentThreshold: 10 }}
      contentContainerStyle={{ paddingBottom: 20 }}
      initialNumToRender={20}
      maxToRenderPerBatch={20}
      windowSize={21}
      removeClippedSubviews={false}
    />
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#f2f2f2',
    padding: 8,
  },
  emptyCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
});

export default MeetingListSection;
