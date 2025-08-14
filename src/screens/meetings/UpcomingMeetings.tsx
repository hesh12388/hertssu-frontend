import { Ionicons } from "@expo/vector-icons";
import { addDays, format, parseISO } from "date-fns";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../App";
import { getMeetingsInRange } from "../../../services/meetingServices";
import { Meeting } from "../../../types/meeting";
import AddMeetingModal from "./AddMeeting";
import MeetingDetails from "./MeetingDetails";

const useMeetings = (isHistory: boolean) => {
  const [sections, setSections] = useState<{ title: string; data: Meeting[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  useEffect(() => {
    const fetchMeetings = async () => {
      if (!auth?.api || !auth?.user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const today = new Date();

        let from: Date;
        let to: Date;

        if (isHistory) {
          from = addDays(today, -90);
          to = addDays(today, -1);
        } else {
          from = today;
          to = addDays(today, 90);
        }

        const res = await getMeetingsInRange(
          auth.api,
          format(from, "yyyy-MM-dd"),
          format(to, "yyyy-MM-dd")
        );

        const meetings = res.data.content || res.data;

        // Filter only scheduled meetings (exclude those with meetingId -1)
        const scheduledMeetings = meetings.filter(meeting => meeting.meetingId !== -1);

        const grouped: { [date: string]: Meeting[] } = scheduledMeetings.reduce(
          (acc, meeting) => {
            if (meeting.date) {
              acc[meeting.date] = acc[meeting.date] || [];
              acc[meeting.date].push(meeting);
            }
            return acc;
          },
          {}
        );

        // Only create sections for dates that have meetings
        const newSections = Object.keys(grouped)
          .sort((a, b) => isHistory ? new Date(b).getTime() - new Date(a).getTime() : new Date(a).getTime() - new Date(b).getTime())
          .map(date => ({
            title: date,
            data: grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime)),
          }));

        setSections(newSections);
      } catch (err) {
        console.error("❌ Error fetching meetings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [auth?.api, auth?.user, isHistory]);

  return { sections, loading };
};

const UpcomingMeetingsWithCalendar = ({ navigation }: any) => {
  const [isOnHistory, setIsOnHistory] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isAddModalVisible, setAddModalVisible] = useState(false);

  const sectionListRef = useRef<SectionList>(null);

  const { sections, loading } = useMeetings(isOnHistory);

  const filteredSections = useMemo(() => {
    if (!searchText) return sections;
    
    return sections
      .map(section => ({
        ...section,
        data: section.data.filter(meeting => 
          meeting.title.toLowerCase().includes(searchText.toLowerCase()) ||
          (meeting.participants && meeting.participants.some(p => 
            p.name?.toLowerCase().includes(searchText.toLowerCase())
          ))
        )
      }))
      .filter(section => section.data.length > 0);
  }, [sections, searchText]);

  const openMeetingDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setModalVisible(true);
  };

  const handleSearchIconPress = () => setIsSearchExpanded(true);
  const handleSearchBlur = () => {
    if (searchText === "") setIsSearchExpanded(false);
  };

  const renderMeetingCard = ({ item }: { item: Meeting }) => (
    <TouchableOpacity onPress={() => openMeetingDetails(item)} style={styles.meetingCard}>
      <View style={styles.meetingContent}>
        <View style={styles.meetingHeader}>
          <Text style={styles.meetingTitle}>{item.title}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>SCHEDULED</Text>
          </View>
        </View>
        
        <Text style={styles.meetingRole}>
          {item.participants?.[0]?.role || "Meeting Participant"}
        </Text>
        
        <Text style={styles.meetingDepartment}>
          {item.location || item.description || "Meeting Location"}
        </Text>
        
        <View style={styles.meetingTimeContainer}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.meetingTime}>
            {format(parseISO(item.date), "dd/MM/yyyy")} • {item.startTime} - {item.endTime}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E9435E" />
          <Text>Loading meetings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={45} color="black" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Hertssu</Text>
        <TouchableOpacity>
          <Ionicons name="person-circle-outline" size={45} color="black" />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {isOnHistory ? "Meeting History" : "Upcoming Meetings"}
        </Text>
        <TouchableOpacity onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={34} color="#E9435E" />
        </TouchableOpacity>
        <AddMeetingModal
          visible={isAddModalVisible}
          onClose={() => setAddModalVisible(false)}
          onMeetingCreated={() => {}}
        />
      </View>

      {/* Toggle + Search */}
      <View style={styles.optionsContainer}>
        <View style={styles.options}>
          <TouchableOpacity 
            onPress={() => setIsOnHistory(false)} 
            style={!isOnHistory ? styles.activeOption : styles.inactiveOption}
          >
            <Text style={isOnHistory ? styles.inactiveText : styles.activeText}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setIsOnHistory(true)} 
            style={isOnHistory ? styles.activeOption : styles.inactiveOption}
          >
            <Text style={isOnHistory ? styles.activeText : styles.inactiveText}>History</Text>
          </TouchableOpacity>
        </View>
        {isSearchExpanded ? (
          <TextInput
            placeholder="Search meetings..."
            value={searchText}
            onChangeText={setSearchText}
            onBlur={handleSearchBlur}
            style={styles.searchBar}
            placeholderTextColor="#999"
            autoFocus
          />
        ) : (
          <TouchableOpacity onPress={handleSearchIconPress}>
            <Ionicons name="search-outline" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Meeting List */}
      {filteredSections.length > 0 ? (
        <SectionList
          ref={sectionListRef}
          sections={filteredSections}
          keyExtractor={(item) => item.meetingId?.toString()}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>
              {format(parseISO(section.title), "EEEE, MMM d, yyyy")}
            </Text>
          )}
          renderItem={renderMeetingCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchText ? "No meetings found" : `No ${isOnHistory ? 'past' : 'upcoming'} meetings`}
          </Text>
        </View>
      )}

      <MeetingDetails
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        meeting={selectedMeeting}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f5f5" 
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },

  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  navTitle: { 
    fontSize: 18, 
    fontWeight: "bold" 
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
  },
  headerText: { 
    fontSize: 24, 
    fontWeight: "bold" 
  },

  optionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  options: { 
    flexDirection: "row", 
    gap: 30 
  },
  activeOption: { 
    borderBottomWidth: 3, 
    borderColor: "#E9435E",
    paddingBottom: 8,
  },
  inactiveOption: {
    paddingBottom: 11,
  },
  activeText: { 
    fontSize: 16, 
    fontWeight: "bold",
    color: "#E9435E",
  },
  inactiveText: { 
    fontSize: 16, 
    fontWeight: "normal", 
    color: "#666" 
  },

  searchBar: {
    padding: 12,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 20,
    width: "60%",
    backgroundColor: "#f9f9f9",
    fontSize: 16,
  },

  listContainer: {
    paddingBottom: 20,
  },

  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: "#333",
  },

  meetingCard: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  meetingContent: {
    flex: 1,
  },

  meetingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  meetingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    flex: 1,
    marginRight: 10,
  },

  statusBadge: {
    backgroundColor: "#E9435E",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },

  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },

  meetingRole: {
    fontSize: 16,
    color: "#444",
    marginBottom: 4,
    fontWeight: "500",
  },

  meetingDepartment: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },

  meetingTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  meetingTime: {
    fontSize: 14,
    color: "#666",
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  emptyText: {
    fontSize: 18,
    color: "#999",
    marginTop: 16,
    textAlign: "center",
  },
});

export default UpcomingMeetingsWithCalendar;