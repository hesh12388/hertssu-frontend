import { useAuth } from '@/App';
import { useDeleteMeeting, usePastMeetings, useUpcomingMeetings } from '@/src/hooks/useMeetings';
import { usePermissions } from '@/src/hooks/usePermissions';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, RefreshControl, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NavBar from '../../components/Navbar';
import { StatusMessage } from '../../components/StatusMessage';
import { MeetingType, formatMeetingDate, formatMeetingTime, isMeetingUpcoming } from '../../types/meeting';
import CreateMeetingModal from './CreateMeetingModal';
import MeetingDetailsModal from './MeetingDetailsModal';
interface MeetingSection {
    title: string;
    data: MeetingType[];
}

const Meetings = () => {
    const [showUpcoming, setShowUpcoming] = useState(true);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<MeetingType | null> (null);
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
    
    // Status message state
    const [showStatus, setShowStatus] = useState(false);
    const [loading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    const { user } = useAuth()!;
    const { isMember } = usePermissions(user);

    
    const { 
        data: upcomingData,
        isLoading: isUpcomingLoading, 
        error: errorUpcoming, 
        refetch: refetchUpcoming,
        isFetching: isFetchingUpcoming,
        fetchNextPage: fetchNextUpcoming,
        hasNextPage: hasNextUpcoming,
        isFetchingNextPage: isFetchingNextUpcoming
    } = useUpcomingMeetings(showUpcoming);
    
    const { 
        data: pastData,
        isLoading: isPastLoading, 
        error: errorPast,
        isFetching: isFetchingPast,
        refetch: refetchPast,
        fetchNextPage: fetchNextPast,
        hasNextPage: hasNextPast,
        isFetchingNextPage: isFetchingNextPast
    } = usePastMeetings(!showUpcoming);

    const deleteMeetingMutation = useDeleteMeeting();

    // Flatten paginated data
    const upcomingMeetings = useMemo(() => 
        upcomingData?.pages.flatMap(page => page.content) || [], 
        [upcomingData?.pages]
    );

    const pastMeetings = useMemo(() => 
        pastData?.pages.flatMap(page => page.content) || [], 
        [pastData?.pages]
    );

    const currentMeetings = showUpcoming ? upcomingMeetings : pastMeetings
    // Group meetings by date
    const meetingSections = useMemo((): MeetingSection[] => {
        const grouped: { [key: string]: MeetingType[] } = {};
        
        currentMeetings.forEach(meeting => {
            const dateKey = meeting.date;
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(meeting);
        });

        // Sort meetings within each date by start time
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => {
                if (a.isAllDay && !b.isAllDay) return -1;
                if (!a.isAllDay && b.isAllDay) return 1;
                if (a.isAllDay && b.isAllDay) return 0;
                return a.startTime.localeCompare(b.startTime);
            });
        });

        // Convert to section format and sort by date
        return Object.entries(grouped)
            .map(([date, meetings]) => ({
                title: formatMeetingDate(date),
                data: meetings
            }))
            .sort((a, b) => {
                const dateA = a.data[0]?.date || '';
                const dateB = b.data[0]?.date || '';
                return showUpcoming ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
            });
    }, [currentMeetings, showUpcoming]);

    const currentQuery = showUpcoming ? {
        refetch: refetchUpcoming,
        hasNextPage: hasNextUpcoming,
        isFetchingNextPage: isFetchingNextUpcoming,
        error: errorUpcoming,
        isLoading: isUpcomingLoading,
        fetchNextPage: fetchNextUpcoming,
        isFetching: isFetchingUpcoming
    } : {
        refetch: refetchPast,
        hasNextPage: hasNextPast,
        isFetchingNextPage: isFetchingNextPast,
        error: errorPast,
        isLoading: isPastLoading,
        fetchNextPage: fetchNextPast,
        isFetching: isFetchingPast
    };


    const confirmDeleteMeeting = (meeting: MeetingType) => {
        Alert.alert(
            "Delete Meeting",
            `Are you sure you want to delete "${meeting.title}"?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteMeeting(meeting.meetingId)
                }
            ]
        );
    };

    const deleteMeeting = async (meetingId: number) => {
        setIsLoading(true);
        setShowStatus(true);
        setStatusMessage("Deleting meeting...");

        deleteMeetingMutation.mutate({ meetingId }, {
            onSuccess: () => {
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("Meeting deleted successfully!");
                setTimeout(() => setShowStatus(false), 2500);
            },
            onError: () => {
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error deleting meeting!");
                setTimeout(() => setShowStatus(false), 2500);
            }
        });
    };

    const handleCreateMeeting = () => {
        setIsCreateModalVisible(true);
    };

    const handleMeetingDetails = (meeting: MeetingType) => {
        setSelectedMeeting(meeting);
        setIsDetailsModalVisible(true);
    }

    const handleJoinMeeting = (meeting: MeetingType) => {
        if (meeting.joinUrl) {
            Linking.openURL(meeting.joinUrl).catch(() => {
                Alert.alert('Error', 'Could not open meeting link');
            });
        } else {
            Alert.alert('No Link', 'This meeting does not have a join link available');
        }
    };

    const onRefresh = useCallback(() => {
        currentQuery.refetch();
    }, [currentQuery.refetch]);

    const onEndReached = useCallback(() => {
        if (currentQuery.hasNextPage && !currentQuery.isFetchingNextPage) {
            currentQuery.fetchNextPage();
        }
    }, [currentQuery.hasNextPage, currentQuery.isFetchingNextPage, currentQuery.fetchNextPage]);

    const renderMeetingItem = ({ item }: { item: MeetingType }) => {
        const isUpcoming = isMeetingUpcoming(item.date, item.startTime);
        const canDelete = isUpcoming && (item.createdBy.userId === user?.id);
        const showJoinButton = isUpcoming && item.joinUrl && item.joinUrl.trim() !== '';
        const showLogButton = !isUpcoming;

        return (
            <TouchableOpacity 
                style={styles.meetingCard}
                onPress={() => {handleMeetingDetails(item)}}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.meetingTitle} numberOfLines={1}>{item.title}</Text>
                    {canDelete && (
                        <TouchableOpacity 
                            onPress={(e) => {
                                e.stopPropagation();
                                confirmDeleteMeeting(item);
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color="#ff4444" />
                        </TouchableOpacity>
                    )}
                </View>
                
                <Text style={styles.meetingLocation} numberOfLines={1}>
                    {item.location || 'No location specified'}
                </Text>
                
                <View style={styles.meetingTimeRow}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.meetingTime}>
                        {formatMeetingTime(item.startTime, item.endTime, item.isAllDay)}
                    </Text>
                </View>

                {showJoinButton && (
                    <TouchableOpacity 
                        style={styles.joinButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleJoinMeeting(item);
                        }}
                    >
                        <Ionicons name="videocam" size={16} color="white" />
                        <Text style={styles.joinButtonText}>Join</Text>
                    </TouchableOpacity>
                )}
                {showLogButton && (
                    <TouchableOpacity 
                        style={styles.joinButton}
                        onPress={() => {
                          handleMeetingDetails(item);
                        }}
                    >
                        <Ionicons name="pencil-sharp" size={16} color="white" />
                        <Text style={styles.joinButtonText}>Log Meeting</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section }: { section: MeetingSection }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons 
                name={showUpcoming ? "calendar-outline" : "time-outline"} 
                size={64} 
                color="#ccc" 
            />
            <Text style={styles.emptyTitle}>
                No {showUpcoming ? "upcoming" : "past"} meetings
            </Text>
            <Text style={styles.emptySubtitle}>
                {showUpcoming 
                    ? "Create a new meeting to get started" 
                    : "Your completed meetings will appear here"
                }
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <NavBar />
            <View style={styles.header}>
                <Text style={styles.headerText}>
                    {showUpcoming ? "Upcoming Meetings" : "Past Meetings"}
                </Text>
                {!isMember && showUpcoming && (
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={handleCreateMeeting}>
                            <Ionicons name="add-circle-outline" size={34} color='#E9435E' />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Tab Toggle */}
            <View style={styles.tabContainer}>
                <View style={styles.tabToggle}>
                    <TouchableOpacity 
                        onPress={() => setShowUpcoming(true)} 
                        style={[styles.tabButton, showUpcoming && styles.activeTabButton]}
                    >
                        <Text style={[styles.tabText, showUpcoming && styles.activeTabText]}>Upcoming</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setShowUpcoming(false)} 
                        style={[styles.tabButton, !showUpcoming && styles.activeTabButton]}
                    >
                        <Text style={[styles.tabText, !showUpcoming && styles.activeTabText]}>Past</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Meetings List */}
            <SectionList
                sections={meetingSections}
                renderItem={renderMeetingItem}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={(item) => item.meetingId.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl 
                        refreshing={currentQuery.isFetching}
                        onRefresh={onRefresh}
                        tintColor="#E9435E"
                        colors={["#E9435E"]}
                    />
                }
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={currentQuery.isLoading ? null : renderEmptyState}
                stickySectionHeadersEnabled={false}
            />

            {showStatus && !isCreateModalVisible && (
                <View style={styles.statusOverlay}>
                    <StatusMessage 
                        isLoading={loading}
                        isSuccess={isSuccess}
                        loadingMessage={statusMessage}
                        resultMessage={resultMessage}
                    />
                </View>
            )}

            {currentQuery.isLoading && !isCreateModalVisible && !showStatus && (
                <View style={styles.statusOverlay}>
                    <StatusMessage 
                        isLoading={true}
                        isSuccess={false}
                        loadingMessage="Loading meetings..."
                        resultMessage=""
                    />
                </View>
            )}

            {currentQuery.error && !isCreateModalVisible && !showStatus && (
                <View style={styles.errorContainer}>
                    <Text style={{color: 'red'}}>Error loading meetings. Please try again later.</Text>
                </View>
            )}

            <CreateMeetingModal 
                visible={isCreateModalVisible}
                onClose={() => setIsCreateModalVisible(false)} 
            />

            <MeetingDetailsModal
                visible={isDetailsModalVisible}
                onClose={() => setIsDetailsModalVisible(false)}
                selectedMeeting={selectedMeeting}
            />
            
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        flex: 1,
    },
    errorContainer: {
        padding: 20,
        backgroundColor: '#ffebee',
        margin: 10,
        borderRadius: 8,
    },
    statusOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 1000, 
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    tabContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    tabToggle: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTabButton: {
        backgroundColor: '#E9435E',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '600',
    },
    listContainer: {
        paddingBottom: 20,
    },
    meetingCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginHorizontal: 20,
        marginTop:12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    meetingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 12,
    },
    meetingLocation: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
    },
    meetingTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    meetingTime: {
        fontSize: 12,
        color: '#666',
    },
    joinButton: {
        backgroundColor: '#E9435E',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        gap: 6,
    },
    joinButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    sectionHeader: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
    footerLoader: {
        paddingVertical: 20,
    },
});

export default Meetings;