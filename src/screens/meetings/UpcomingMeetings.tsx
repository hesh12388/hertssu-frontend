// src/screens/UpcomingMeetingsWithCalendar.tsx
import { Ionicons } from "@expo/vector-icons";
import { addDays, format, parseISO } from "date-fns";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Linking,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../App";
import { deleteMeeting, getMeetingsInRange } from "../../../services/meetingServices";
import NavBar from "../../components/Navbar";
import AddMeetingModal from "./AddMeeting";
import MeetingDetails from "./details/MeetingDetails";


// TO FIX: PADDING OVER THE HEADER

// TO ADD: AGENDA TO QUICKLY SWITCH AND SCROLL TO DATE


type MeetingListItem = {
  meetingId: number;
  title: string;
  date: string;        
  startTime: string;   
  endTime: string;     
  location?: string | null;
  joinUrl?: string | null;
  recurrenceRule?: string | null;
  isAllDay?: boolean;
};

type Section = { title: string; data: MeetingListItem[] };

// Cache for reducing API calls
type CacheEntry = {
  sections: Section[];
  timestamp: number;
  totalElements: number;
};

const CACHE_DURATION = 2 * 60 * 1000; 
const ITEMS_PER_PAGE = 15; 

// Optimized hook with caching and reduced API calls
const useMeetings = (isHistory: boolean) => {
  const auth = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  // Add cache state
  const [cache] = useState<Map<string, CacheEntry>>(new Map());

  const resetPagination = useCallback(() => {
    setPage(0);
    setSections([]);
    setHasMore(true);
  }, []);

  const getCacheKey = useCallback((isHist: boolean, pageNum: number) => 
    `${isHist ? 'history' : 'upcoming'}-${pageNum}`, []);

  const fetchMeetings = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (!auth?.api || !auth?.user) {
      setSections([]);
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey(isHistory, pageNum);
    
    // Check cache first (only for first page)
    if (pageNum === 0 && !append) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('📦 Using cached data for', cacheKey);
        setSections(cached.sections);
        setHasMore(cached.totalElements > ITEMS_PER_PAGE);
        setLoading(false);
        return;
      }
    }

    if (pageNum === 0 && !append) setLoading(true);
    if (pageNum > 0) setLoadingMore(true);

    try {
      const today = new Date();
      const from = isHistory ? addDays(today, -7) : today;
      const to = isHistory ? addDays(today, -1) : addDays(today, 60);

      console.log(`🔍 Fetching ${isHistory ? 'history' : 'upcoming'} meetings:`, {
        from: format(from, "yyyy-MM-dd"),
        to: format(to, "yyyy-MM-dd"),
        offset: pageNum * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE
      });

      const startTime = performance.now();
      
      const res = await getMeetingsInRange(
        auth.api,
        format(from, "yyyy-MM-dd"),
        format(to, "yyyy-MM-dd"),
        pageNum * ITEMS_PER_PAGE,
        ITEMS_PER_PAGE
      );

      const loadTime = performance.now() - startTime;
      console.log(`⚡ API call completed in ${loadTime.toFixed(2)}ms`);

      const raw = (res as any)?.content || res;
      const meetings = Array.isArray(raw) ? raw : [];
      const totalElements = (res as any)?.totalElements || meetings.length;

      setHasMore(meetings.length === ITEMS_PER_PAGE && (pageNum + 1) * ITEMS_PER_PAGE < totalElements);

      // 🚀 OPTIMIZATION: Simplified data mapping (no client-side recurrence expansion)
      const minimal: MeetingListItem[] = meetings
        .filter((m: any) => m && m.meetingId !== -1 && m.date)
        .map((m: any) => ({
          meetingId: m.meetingId,
          title: m.title ?? "",
          date: m.date,
          startTime: (m.startTime || "").slice(0, 5),
          endTime: (m.endTime || "").slice(0, 5),
          location: m.location ?? null,
          joinUrl: m.joinUrl ?? null,
          recurrenceRule: m.recurrenceRule ?? null,
          isAllDay: !!m.isAllDay,
        }));

      // Group by date (much faster without recurrence expansion)
      const grouped: Record<string, MeetingListItem[]> = minimal.reduce((acc, m) => {
        acc[m.date] = acc[m.date] || [];
        acc[m.date].push(m);
        return acc;
      }, {} as Record<string, MeetingListItem[]>);

      const newSections: Section[] = Object.keys(grouped)
        .sort((a, b) =>
          isHistory
            ? new Date(b).getTime() - new Date(a).getTime()
            : new Date(a).getTime() - new Date(b).getTime()
        )
        .map((date) => ({
          title: date,
          data: grouped[date].sort((a, b) => (a.startTime || "").localeCompare(b.startTime || "")),
        }));

      if (append) {
        setSections(prevSections => {
          // 🚀 OPTIMIZATION: More efficient merging
          const existingDates = new Set(prevSections.map(s => s.title));
          const uniqueNewSections = newSections.filter(s => !existingDates.has(s.title));
          return [...prevSections, ...uniqueNewSections].sort((a, b) =>
            isHistory
              ? new Date(b.title).getTime() - new Date(a.title).getTime()
              : new Date(a.title).getTime() - new Date(b.title).getTime()
          );
        });
      } else {
        setSections(newSections);
        // Cache first page data
        cache.set(cacheKey, {
          sections: newSections,
          timestamp: Date.now(),
          totalElements
        });
      }

    } catch (err) {
      console.error("❌ Error fetching meetings:", err);
      if (!append) setSections([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [auth?.api, auth?.user, isHistory, cache, getCacheKey]);

  const refetch = useCallback(() => {
    // Clear cache on explicit refresh
    cache.clear();
    resetPagination();
    fetchMeetings(0, false);
  }, [resetPagination, fetchMeetings, cache]);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMeetings(nextPage, true);
    }
  }, [hasMore, loadingMore, loading, page, fetchMeetings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  // 🚀 OPTIMIZATION: Only refetch when switching tabs, not on every dependency change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refetch();
    }, 50); // Small delay to batch multiple changes
    
    return () => clearTimeout(timeoutId);
  }, [isHistory]); // Removed other dependencies to prevent cascade

  return { 
    sections, 
    loading, 
    refetch, 
    loadMore, 
    hasMore, 
    loadingMore, 
    refreshing, 
    onRefresh 
  };
};

// 🚀 OPTIMIZATION: Memoized meeting card component
const MeetingCard = React.memo(({ 
  item, 
  onPress, 
  onDelete, 
  onJoin 
}: { 
  item: MeetingListItem;
  onPress: () => void;
  onDelete: () => void;
  onJoin?: () => void;
}) => (
  <View style={styles.meetingCard}>
    <View style={styles.meetingHeader}>
      <Text style={styles.meetingTitle} numberOfLines={1}>
        {item.title}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TouchableOpacity onPress={onDelete}>
          <Ionicons name="ellipsis-vertical" size={20} color="#333" />
        </TouchableOpacity>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {item.recurrenceRule ? "RECURRING" : "SCHEDULED"}
          </Text>
        </View>
      </View>
    </View>

    <TouchableOpacity onPress={onPress} style={styles.meetingContent}>
      <Text style={styles.meetingDepartment}>
        {item.location || "—"}
      </Text>

      <View style={styles.meetingTimeContainer}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.meetingTime}>
          {format(parseISO(item.date), "dd/MM/yyyy")} •{" "}
          {item.isAllDay
            ? "All day"
            : `${item.startTime} - ${item.endTime}`}
        </Text>
        {item.recurrenceRule && (
          <Ionicons
            name="repeat-outline"
            size={16}
            color="#E9435E"
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
    </TouchableOpacity>

    {item.joinUrl && onJoin && (
      <TouchableOpacity style={styles.joinButton} onPress={onJoin}>
        <Ionicons name="videocam-outline" size={18} color="white" />
        <Text style={styles.joinButtonText}>Join</Text>
      </TouchableOpacity>
    )}
  </View>
));

const UpcomingMeetingsWithCalendar = ({ navigation }: any) => {
  const [isOnHistory, setIsOnHistory] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [isAddModalVisible, setAddModalVisible] = useState(false);

  const sectionListRef = useRef<SectionList<MeetingListItem>>(null);
  const auth = useAuth();

  const { 
    sections, 
    loading, 
    refetch, 
    loadMore, 
    hasMore, 
    loadingMore, 
    refreshing, 
    onRefresh 
  } = useMeetings(isOnHistory);

  // 🚀 OPTIMIZATION: Debounced search to avoid excessive filtering
  const filteredSections = useMemo(() => {
    if (!searchText.trim()) return sections;
    
    const needle = searchText.toLowerCase().trim();
    const startTime = performance.now();
    
    const filtered = sections
      .map((s) => ({
        ...s,
        data: s.data.filter((m) => 
          m.title.toLowerCase().includes(needle) ||
          (m.location && m.location.toLowerCase().includes(needle))
        ),
      }))
      .filter((s) => s.data.length > 0);
    
    const filterTime = performance.now() - startTime;
    if (filterTime > 10) {
      console.log(`🔍 Search filtering took ${filterTime.toFixed(2)}ms`);
    }
    
    return filtered;
  }, [sections, searchText]);

  const handleToggle = useCallback((newIsHistory: boolean) => {
    if (newIsHistory !== isOnHistory) {
      setSearchText(""); // Clear search when switching tabs
      setIsOnHistory(newIsHistory);
    }
  }, [isOnHistory]);

  const handleMeetingPress = useCallback((id: number) => {
    setSelectedMeetingId(id);
    setDetailsVisible(true);
  }, []);

  const handleMeetingDelete = useCallback((item: MeetingListItem) => {
    if (item.recurrenceRule) {
      Alert.alert(
        "Delete meeting",
        "Do you want to delete just this occurrence or the whole series?",
        [
          {
            text: "Whole series",
            style: "destructive",
            onPress: () => {
              deleteMeeting(auth!.api, item.meetingId, {
                series: true,
                recurrenceId: item.meetingId.toString()
              })
                .then(() => refetch())
                .catch((e) => console.error("Delete series failed", e));
            },
          },
          {
            text: "This occurrence",
            onPress: () => {
              deleteMeeting(auth!.api, item.meetingId)
                .then(() => refetch())
                .catch((e) => console.error("Delete failed", e));
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } else {
      Alert.alert("Delete meeting", "Are you sure you want to delete this meeting?", [
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMeeting(auth!.api, item.meetingId)
              .then(() => refetch())
              .catch((e) => console.error("Delete failed", e));
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }, [auth?.api, refetch]);

  const handleJoinMeeting = useCallback((joinUrl: string) => {
    Linking.openURL(joinUrl).catch(err => 
      console.error('Failed to open join URL:', err)
    );
  }, []);

  const renderMeetingCard = useCallback(({ item }: { item: MeetingListItem }) => (
    <MeetingCard
      item={item}
      onPress={() => handleMeetingPress(item.meetingId)}
      onDelete={() => handleMeetingDelete(item)}
      onJoin={item.joinUrl ? () => handleJoinMeeting(item.joinUrl!) : undefined}
    />
  ), [handleMeetingPress, handleMeetingDelete, handleJoinMeeting]);

  const renderSectionHeader = useCallback(({ section }: { section: Section }) => (
    <Text style={styles.sectionHeader}>
      {format(parseISO(section.title), "EEEE, MMM d, yyyy")}
    </Text>
  ), []);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#E9435E" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  }, [loadingMore]);

  const keyExtractor = useCallback((item: MeetingListItem, index: number) => 
    `${item.meetingId}-${item.date}-${index}`, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Nav */}
        <NavBar/>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {isOnHistory ? "Meeting History" : "Upcoming Meetings"}
        </Text>
        <TouchableOpacity onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={34} color="#E9435E" />
        </TouchableOpacity>
      </View>

      {/* Toggle + Search */}
      <View style={styles.optionsContainer}>
        <View style={styles.options}>
          <TouchableOpacity
            onPress={() => handleToggle(false)}
            style={!isOnHistory ? styles.activeOption : styles.inactiveOption}
          >
            <Text style={isOnHistory ? styles.inactiveText : styles.activeText}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleToggle(true)}
            style={isOnHistory ? styles.activeOption : styles.inactiveOption}
          >
            <Text style={isOnHistory ? styles.activeText : styles.inactiveText}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {isSearchExpanded ? (
          <TextInput
            placeholder="Search meetings..."
            value={searchText}
            onChangeText={setSearchText}
            onBlur={() => {
              if (searchText === "") setIsSearchExpanded(false);
            }}
            style={styles.searchBar}
            placeholderTextColor="#999"
            autoFocus
          />
        ) : (
          <TouchableOpacity onPress={() => setIsSearchExpanded(true)}>
            <Ionicons name="search-outline" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading && sections.length === 0 ? (
        <View style={[styles.center, { backgroundColor: "#fff", flex: 1 }]}>
          <ActivityIndicator size="large" color="#E9435E" />
          <Text style={{ marginTop: 8 }}>Loading meetings...</Text>
        </View>
      ) : filteredSections.length > 0 ? (
        <SectionList
          ref={sectionListRef}
          sections={filteredSections}
          keyExtractor={keyExtractor}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderMeetingCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E9435E"
              colors={["#E9435E"]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          removeClippedSubviews={true} // 🚀 OPTIMIZATION: Improve scrolling performance
          maxToRenderPerBatch={10} // 🚀 OPTIMIZATION: Render fewer items per batch
          windowSize={10} // 🚀 OPTIMIZATION: Smaller window size
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchText ? "No meetings found" : `No ${isOnHistory ? "past" : "upcoming"} meetings`}
          </Text>
        </View>
      )}

      {/* Modals */}
      <AddMeetingModal
        visible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
        onMeetingCreated={refetch}
      />

      <MeetingDetails
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        meetingId={selectedMeetingId}
        onUpdated={refetch}
        onDeleted={() => {
          setSelectedMeetingId(null);
          refetch();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingTop: 0},
  center: { justifyContent: "center", alignItems: "center" },

  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  navTitle: { fontSize: 18, fontWeight: "bold" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
  },
  headerText: { fontSize: 24, fontWeight: "bold" },

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
  options: { flexDirection: "row", gap: 30 },
  activeOption: {
    borderBottomWidth: 3,
    borderColor: "#E9435E",
    paddingBottom: 8,
  },
  inactiveOption: { paddingBottom: 11 },
  activeText: { fontSize: 16, fontWeight: "bold", color: "#E9435E" },
  inactiveText: { fontSize: 16, fontWeight: "normal", color: "#666" },

  searchBar: {
    padding: 12,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 20,
    width: "60%",
    backgroundColor: "#f9f9f9",
    fontSize: 16,
  },

  listContainer: { paddingBottom: 20 },

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

  meetingContent: { flex: 1 },

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
  statusText: { color: "white", fontSize: 12, fontWeight: "bold" },

  meetingDepartment: { fontSize: 14, color: "#666", marginBottom: 12 },

  meetingTimeContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  meetingTime: { fontSize: 14, color: "#666" },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: { fontSize: 18, color: "#999", marginTop: 16, textAlign: "center" },

  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#E9435E",
  },
  joinButtonText: { color: "white", fontSize: 14, fontWeight: "bold", marginLeft: 6 },

  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
});

export default UpcomingMeetingsWithCalendar;