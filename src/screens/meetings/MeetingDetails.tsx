import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Modal from 'react-native-modal';

// Type definitions
type Meeting = {
  meetingId: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  type?: string;
  location?: string;
  visibility?: string;
  description?: string;
  recurrence?: string;
  allDay?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  meeting: Meeting | null;
};

const MeetingDetails = ({ visible, onClose, meeting }: Props) => {
  if (!meeting) return null;

  return (
    <Modal isVisible={visible} style={styles.modal}>
      <View style={styles.container}>
        {/* Header with close button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Text style={styles.iconText}>📅</Text>
          </View>
          <Text style={styles.headerTitle}>{meeting.title}</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreText}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <Text style={[styles.tab, styles.activeTab]}>Details</Text>
          <Text style={styles.tab}>Files</Text>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.meetingTitle}>{meeting.title}</Text>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateText}>Sunday {meeting.date}</Text>
            <Text style={styles.timeText}>{meeting.startTime} - {meeting.endTime}</Text>
            <Text style={styles.platformText}>Comitee: {meeting.location}</Text>
            <Text style={styles.platformText}>Location: {meeting.location}</Text>
          </View>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareIcon}>↗</Text>
            <Text style={styles.shareText}>Share meeting invitation</Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.rejoinButton}>
              <Text style={styles.rejoinText}>Join</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.meetingInfo}>
            <Text style={styles.meetingInfoText}>
                {meeting.description || 'No description provided.'}
            </Text>
            <TouchableOpacity>
              <Text style={styles.showMoreText}>Show more</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Participants (3)</Text>
          
          <View style={styles.participantItem}>
            <View style={[styles.avatar, { backgroundColor: '#90EE90' }]}>
              <Text style={styles.avatarText}>VO</Text>
            </View>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>Victor Okoroafor</Text>
              <Text style={styles.participantRole}>Organizer</Text>
            </View>
          </View>

          <View style={styles.participantItem}>
            <View style={[styles.avatar, { backgroundColor: '#DDD' }]}>
              <Text style={styles.avatarText}>BK</Text>
            </View>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>Burak Kose</Text>
            </View>
          </View>

          <View style={styles.participantItem}>
            <View style={[styles.avatar, { backgroundColor: '#FFB6C1' }]}>
              <Text style={styles.avatarText}>HA</Text>
            </View>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>Hesham Ahmed</Text>
            </View>
          </View>

          {/* Additional Actions */}
          <View style={styles.additionalActions}>
            <TouchableOpacity style={styles.actionItem}>
              <Text style={styles.actionIcon}>↗</Text>
              <Text style={styles.actionText}>Transfer the meeting</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <Text style={styles.actionIcon}>🔄</Text>
              <Text style={styles.actionText}>Show series</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <Text style={styles.actionIcon}>🗑</Text>
              <Text style={[styles.actionText, styles.deleteText]}>Delete occurrence</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { 
    margin: 0, 
    justifyContent: 'flex-start',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  backText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#6B73FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  moreButton: {
    padding: 4,
  },
  moreText: {
    fontSize: 20,
    color: '#000',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 16,
    color: '#666',
  },
  activeTab: {
    color: '#6B73FF',
    borderBottomWidth: 2,
    borderBottomColor: '#6B73FF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  meetingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  dateTimeContainer: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  platformText: {
    fontSize: 16,
    color: '#666',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  shareIcon: {
    fontSize: 16,
    color: '#6B73FF',
    marginRight: 8,
  },
  shareText: {
    fontSize: 16,
    color: '#6B73FF',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  rejoinButton: {
    backgroundColor: '#6B73FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rejoinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28A745',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptedIcon: {
    color: '#fff',
    fontSize: 16,
    marginRight: 6,
  },
  acceptedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 6,
  },
  dropdownIcon: {
    color: '#fff',
    fontSize: 16,
  },
  meetingInfo: {
    marginBottom: 24,
  },
  meetingInfoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: '#6B73FF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  participantRole: {
    fontSize: 14,
    color: '#666',
  },
  participantStatus: {
    fontSize: 14,
    color: '#28A745',
  },
  additionalActions: {
    marginTop: 24,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  actionText: {
    fontSize: 16,
    color: '#000',
  },
  deleteText: {
    color: '#DC3545',
  },
});

export default MeetingDetails;