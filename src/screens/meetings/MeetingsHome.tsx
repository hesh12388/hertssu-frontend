import { useAuth } from "@/App";
import { StatusMessage } from "@/src/components/StatusMessage";
import {
    useMeetingHistory,
    useMeetingsVM,
    useUpcomingMeetings,
} from "@/src/hooks/useMeetings";
import type { MeetingResponseDto } from "@/src/types/meeting";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    SectionList,
    SectionListData,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import NavBar from "../../components/Navbar";
import AddMeetingModal from "./AddMeeting";
import MeetingDetails from "./details/MeetingDetails";

type TabKey = "upcoming" | "history";
type Section = { title: string; data: MeetingResponseDto[] };

export default function MeetingsHome() {
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [search, setSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isAddMeetingVisible, setIsAddMeetingVisible] = useState(false);

  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const auth = useAuth();
  const api = auth?.api;

  if (!api) {
    return (
      <SafeAreaView style={meetingHomeStyles.container}>
        <StatusMessage loadingMessage="Loading account..." />
      </SafeAreaView>
    );
  }

  // View-model for list UI (sections, handlers, status flags)
  const vm = useMeetingsVM({
    api,
    tab,
    search,
    onOpenDetails: (id) => {
      setSelectedId(id);
      setDetailsVisible(true);
    },
  });

  const upcomingQ = useUpcomingMeetings(api, tab === "upcoming");
  const historyQ = useMeetingHistory(api, tab === "history");

  const selectedSeed: MeetingResponseDto | undefined = useMemo(() => {
    const pages =
      tab === "upcoming" ? upcomingQ.data?.pages : historyQ.data?.pages;
    const all = pages?.flatMap((p) => p.content) ?? [];
    return all.find((m) => m.meetingId === selectedId);
  }, [tab, upcomingQ.data?.pages, historyQ.data?.pages, selectedId]);

  return (
    <SafeAreaView style={meetingHomeStyles.container}>
      {/* NavBar at top */}
      <NavBar />

      {/* Header */}
      <View style={meetingHomeStyles.header}>
        <Text style={meetingHomeStyles.headerText}>
          {tab === "upcoming" ? "Upcoming Meetings" : "Meeting History"}
        </Text>
        <TouchableOpacity onPress={() => setIsAddMeetingVisible(true)}>
          <Ionicons name="add-circle-outline" size={34} color="#E9435E" />
        </TouchableOpacity>
      </View>

      {/* Inline loading while VM is refreshing */}
      {/* {vm.isRefreshing && <StatusMessage isLoading loadingMessage="Refreshing meetings..." />} */}

      {/* Create modal */}
      <AddMeetingModal
        visible={isAddMeetingVisible}
        onClose={() => setIsAddMeetingVisible(false)}
      />

      {/* Tabs + Search */}
      <View style={meetingHomeStyles.optionsContainer}>
        <View style={meetingHomeStyles.options}>
          <TouchableOpacity
            onPress={() => {
              setSearch("");
              setTab("upcoming");
            }}
            style={
              tab === "upcoming"
                ? meetingHomeStyles.activeOption
                : meetingHomeStyles.inactiveOption
            }
          >
            <Text
              style={
                tab === "upcoming"
                  ? meetingHomeStyles.activeText
                  : meetingHomeStyles.inactiveText
              }
            >
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSearch("");
              setTab("history");
            }}
            style={
              tab === "history"
                ? meetingHomeStyles.activeOption
                : meetingHomeStyles.inactiveOption
            }
          >
            <Text
              style={
                tab === "history"
                  ? meetingHomeStyles.activeText
                  : meetingHomeStyles.inactiveText
              }
            >
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* {isSearchExpanded ? (
          <TextInput
            placeholder="Search meetings..."
            value={search}
            onChangeText={setSearch}
            onBlur={() => {
              if (search === "") setIsSearchExpanded(false);
            }}
            style={meetingHomeStyles.searchBar}
            placeholderTextColor="#999"
            autoFocus
          />
        ) : (
          <TouchableOpacity onPress={() => setIsSearchExpanded(true)}>
            <Ionicons name="search-outline" size={24} color="#666" />
          </TouchableOpacity>
        )} */}
      </View>

      {/* List */}
      <MeetingsList
        sections={vm.sections}
        isLoadingInitial={vm.isLoadingInitial}
        isRefreshing={vm.isRefreshing}
        isFetchingMore={vm.isFetchingMore}
        onRefresh={vm.onRefresh}
        onEndReached={vm.onEndReached}
        onPressItem={vm.onPressItem}
        onDeleteItem={vm.onDeleteItem}
        onJoinItem={vm.onJoinItem}
        emptyLabel={
          search
            ? "No meetings found"
            : `No ${tab === "history" ? "past" : "upcoming"} meetings`
        }
        statusMessage={vm.statusMessage}
      />

      <MeetingDetails
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        meetingId={selectedId}
        seed={selectedSeed}
        showPerformanceTab={tab === "history"}   
        onDeleted={() => {
          setDetailsVisible(false);
          setSelectedId(null);
        }}
      />
    </SafeAreaView>
  );
}

function MeetingsList(props: {
  sections: Section[];
  isLoadingInitial: boolean;
  isRefreshing: boolean;
  isFetchingMore: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  onPressItem: (m: MeetingResponseDto) => void;
  onDeleteItem: (m: MeetingResponseDto) => void;
  onJoinItem: (m: MeetingResponseDto) => void;
  emptyLabel: string;
  statusMessage: string | null;
}) {
  const listRef = useRef<SectionList<MeetingResponseDto>>(null);

  const keyExtractor = useCallback(
    (item: MeetingResponseDto, idx: number) =>
      `${item.meetingId}-${item.date}-${idx}`,
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: MeetingResponseDto }) => (
      <MeetingCard
        item={item}
        onPress={() => props.onPressItem(item)}
        onDelete={() => props.onDeleteItem(item)}
        onJoin={item.joinUrl ? () => props.onJoinItem(item) : undefined}
      />
    ),
    [props]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<MeetingResponseDto> }) => (
      <Text style={meetingListStyles.sectionHeader}>
        {format(
          parseISO((section as unknown as Section).title),
          "EEEE, MMM d, yyyy"
        )}
      </Text>
    ),
    []
  );

  const renderFooter = useCallback(() => {
    if (!props.isFetchingMore) return null;
    return (
      <View style={meetingListStyles.loadingFooter}>
        <ActivityIndicator size="small" />
        <Text style={meetingListStyles.loadingText}>Loading more...</Text>
      </View>
    );
  }, [props.isFetchingMore]);

  if (props.isLoadingInitial) {
    return <StatusMessage isLoading loadingMessage="Loading meetings..." />;
  }

  if (props.statusMessage) {
    return (
      <View style={meetingListStyles.emptyState}>
        <Ionicons name="calendar-outline" size={64} color="#ccc" />
        <Text style={meetingListStyles.emptyText}>{props.statusMessage}</Text>
      </View>
    );
  }

  if (props.sections.length === 0 && props.isRefreshing) {
    return <StatusMessage isLoading loadingMessage="Refreshing meetings..." />;
  }

  return (
    <SectionList
      ref={listRef}
      sections={props.sections}
      keyExtractor={keyExtractor}
      renderSectionHeader={renderSectionHeader}
      renderItem={renderItem}
      contentContainerStyle={meetingListStyles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={props.isRefreshing}
          onRefresh={props.onRefresh}
          tintColor="#E9435E"
          colors={["#E9435E"]}
        />
      }
      onEndReached={props.onEndReached}
      onEndReachedThreshold={0.3}
      ListFooterComponent={renderFooter}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
}

function MeetingCard({
  item,
  onPress,
  onDelete,
  onJoin,
}: {
  item: MeetingResponseDto;
  onPress: () => void;
  onDelete: () => void;
  onJoin?: () => void;
}) {
  return (
    <View style={meetingCardStyles.meetingCard}>
      <View style={meetingCardStyles.meetingHeader}>
        <Text style={meetingCardStyles.meetingTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color="#c33" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onPress} style={meetingCardStyles.meetingContent}>
        <Text style={meetingCardStyles.meetingLocation}>
          {item.location || "No location"}
        </Text>
        <View style={meetingCardStyles.row}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={meetingCardStyles.meetingTime}>
            {format(parseISO(item.date), "dd/MM/yyyy")} •{" "}
            {item.isAllDay ? "All day" : `${item.startTime} - ${item.endTime}`}
          </Text>
        </View>
      </TouchableOpacity>

      {!!item.joinUrl && (
        <TouchableOpacity style={meetingCardStyles.joinButton} onPress={onJoin}>
          <Ionicons name="videocam-outline" size={18} color="#fff" />
          <Text style={meetingCardStyles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const meetingHomeStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffffff" },
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
  activeOption: { borderBottomWidth: 3, borderColor: "#E9435E", paddingBottom: 8 },
  inactiveOption: { paddingBottom: 11 },
  activeText: { fontSize: 16, fontWeight: "bold", color: "#E9435E" },
  inactiveText: { fontSize: 16, color: "#666" },
  searchBar: {
    padding: 12,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 20,
    width: "60%",
    backgroundColor: "#f9f9f9",
    fontSize: 16,
  },
});

const meetingListStyles = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center" },
  listContainer: { paddingBottom: 20 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: "#333",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: { fontSize: 18, color: "#999", marginTop: 16, textAlign: "center" },
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: { fontSize: 14, color: "#666" },
});

const meetingCardStyles = StyleSheet.create({
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
  meetingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  meetingTitle: { fontSize: 18, fontWeight: "bold", color: "#111", flex: 1, marginRight: 10 },
  meetingContent: { flex: 1 },
  meetingLocation: { fontSize: 14, color: "#666", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  meetingTime: { fontSize: 14, color: "#666" },
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
});
