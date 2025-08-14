import { useAuth } from '@/App';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NavBar from '../../components/Navbar';
import { StatusMessage } from '../../components/StatusMessage';
import { InterviewType } from '../../types/Interview';
import DetailsModal from './DetailsModal';
import ScheduleModal from './ScheduleModal';
const Interview = () => {

    const [isOnHistory, setIsOnHistory] = useState(false);


    const [isModalVisible, setIsModalVisible] = useState(false);
    

    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [resultMessage, setResultMessage] = useState("");

    const auth = useAuth();

    const [interviews, setInterviews] = useState<InterviewType[]>([]);
    const [showMyInterviews, setShowMyInterviews] = useState(true);
    const [selectedInterview, setSelectedInterview] = useState<InterviewType | null>(null);
    const [showInterviewDetails, setShowInterviewDetails] = useState(false);
    

    useEffect(() => {
        fetchInterviews();
    }, []);

    const fetchInterviews = async () => {
        try {
            setIsLoading(true);
            setShowStatus(true);
            setStatusMessage("Fetching your interviews...")
            
            const response = await auth?.api.get('/interviews');
            setInterviews(response?.data);
            setIsSuccess(true);
            setIsLoading(false);
            setResultMessage("Succesfully fetched your interviews!")
        } catch (error) {
            console.error('Error fetching interviews:', error);
            setIsSuccess(false);
            setIsLoading(false);
            setResultMessage("Error fetching your interviews!");
        } finally {
            setTimeout(() => {
                setShowStatus(false);
            }, 2500);
        }
    };

    const getFilteredInterviews = () => {
        const now = new Date();
        let filtered = interviews;

        // Filter by time (upcoming vs history)
        if (isOnHistory) {
            filtered = interviews.filter(interview => new Date(interview.endTime) < now);
        } else {
            filtered = interviews.filter(interview => new Date(interview.startTime) >= now);
        }

        // Filter by My/All interviews
        if (showMyInterviews && auth?.user?.email) {
            filtered = filtered.filter(interview => interview.interviewerEmail === auth?.user?.email);
        }
        
        return filtered;
    };

    const confirmDeleteInterview = (item: InterviewType) => {
        Alert.alert(
            "Delete Interview",
            `Are you sure you want to delete the interview with ${item.name}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteInterview(item.id)
                }
            ]
        );
    };
    
    const deleteInterview = async (interviewId: string) => {
        try {
            if (!interviewId) {
                console.error('No interview ID provided for deletion');
                return;
            }
            setIsLoading(true);
            setShowStatus(true);
            setStatusMessage("Deleting interview...");

            await auth?.api.delete(`/interviews/${interviewId}`);
            setInterviews(prev => prev.filter(int => int.id !== interviewId));
            setIsLoading(false);
            setIsSuccess(true);
            setResultMessage("Interview deleted successfully!");
        } catch (error) {
            console.error('Error deleting interview:', error);
            setIsLoading(false);
            setIsSuccess(false);
            setResultMessage("Error deleting interview!");
        } finally {
            setTimeout(() => {
                setShowStatus(false);
                setIsLoading(false);
            }, 2500);
        }
    }

    const COMMITTEES: Record<string, string[]>= {
        'Executive Board': [],
        'Officers': [],
        'Human Resources & Development': [
            'Training & Development',
            'Recruitment, Documentation & Reports'
        ],
        'Academic Affairs': [
            'Academic Concerns & Support (Representation)',
            'Careers and Internships'
        ],
        'Marketing': [
            'Social Media',
            'OnGround Marketing'
        ],
        'Public Relations': [
            'Corporate Relations',
            'Universities Relations'
        ],
        'Sports': [
            'Sports Events',
            'Sports Representations & Service'
        ],
        'Treasury': [
            'Fundraising & Budgeting',
            'ID Benefits'
        ],
        'Services': [
            'Volunteering & Charity',
            'Sustainability & Eco Projects'
        ],
        'Entertainment & Events': [
            'Continuous Events and Trips',
            'Competition'
        ]
    };

    const POSITIONS: string [] = ["President", "Vice President", "Executive Officer", "Chairperson", "Associate Chairperson", "Leader", "Associate Leader", "Member"]


    const handleAddInterview = () => {
        setIsModalVisible(true);
    };

    const formatDateTime = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
    };

    // When opening the modal
    const openInterviewDetails = (interview: InterviewType) => {
        console.log('Opening interview details for:', interview);
        setSelectedInterview(interview);
        setShowInterviewDetails(true);
    };

    const renderInterviewItem = ({ item }: {item: InterviewType}) => {
        const startDateTime = formatDateTime(item.startTime);
        const endDateTime = formatDateTime(item.endTime);

        return (
            <TouchableOpacity 
                style={styles.interviewCard}
                onPress={() => {
                    openInterviewDetails(item);
                }}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.candidateName}>{item.name}</Text>
                    
                    <View style={[
                        styles.statusBadge, 
                        item.status === "LOGGED" 
                            ? styles.loggedBadge 
                            : item.status === "SCHEDULED" && new Date(item.endTime) < new Date()
                                ? styles.notLoggedBadge 
                                : styles.scheduledBadge
                    ]}>
                        {(new Date(item.endTime) < new Date() && item.status === 'SCHEDULED') ? (
                            <Text style={styles.statusText}>NOT LOGGED</Text>
                        ):(
                            <Text style={styles.statusText}>{item.status}</Text>
                        )}
                    </View>
            
                </View>
                
                
                <Text style={styles.position}>{item.position}</Text>
                <Text style={styles.committee}>{item.committee} {item.subCommittee && `• ${item.subCommittee}`}</Text>
                
                <View style={styles.timeContainer}>
                    <View style={styles.cardHeaderBottom}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.timeText}>
                            {startDateTime.date} • {startDateTime.time} - {endDateTime.time}
                        </Text>
                    </View>
                     {(item.status === "SCHEDULED" && new Date() < new Date(item.startTime)) && (
                        <TouchableOpacity 
                            onPress={(e) => {
                                e.stopPropagation();
                            
                                confirmDeleteInterview(item);
                            }}
                        >
                            <Ionicons name="trash-outline" size={30} color="#ff4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const filteredInterviews = getFilteredInterviews();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <NavBar />
                <View style={styles.header}>
                    <Text style={styles.headerText}>
                        {isOnHistory ? "Interview History" : "Upcoming Interviews"}
                    </Text>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={handleAddInterview}>
                            <Ionicons name="add-circle-outline" size={34} color='#E9435E' />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.optionsContainer}>
                    <View style={styles.options}>
                        <TouchableOpacity onPress={() => setIsOnHistory(false)} style={!isOnHistory ? styles.activeOption : {}}>
                            <Text style={isOnHistory ? styles.inactiveText: styles.activeText}>Upcoming</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsOnHistory(true)} style={isOnHistory ? styles.activeOption : {}}>
                            <Text style={isOnHistory ? styles.activeText: styles.inactiveText}>History</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* My/All interviews toggle */}
                <View style={styles.filterContainer}>
                    <View style={styles.filterToggle}>
                        <TouchableOpacity 
                            onPress={() => setShowMyInterviews(true)} 
                            style={[styles.filterButton, showMyInterviews && styles.activeFilterButton]}
                        >
                            <Text style={[styles.filterText, showMyInterviews && styles.activeFilterText]}>My Interviews</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setShowMyInterviews(false)} 
                            style={[styles.filterButton, !showMyInterviews && styles.activeFilterButton]}
                        >
                            <Text style={[styles.filterText, !showMyInterviews && styles.activeFilterText]}>All Interviews</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Interview List */}
                <View style={styles.interviewsList}>
                    {filteredInterviews.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>No interviews found</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredInterviews}
                            renderItem={renderInterviewItem}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    )}
                </View>
            </ScrollView>

            {showStatus && !isModalVisible && (
                <View style={styles.statusOverlay}>
                    <StatusMessage 
                        isLoading={isLoading}
                        isSuccess={isSuccess}
                        loadingMessage={statusMessage}
                        resultMessage={resultMessage}
                    />
                </View>
            )}

            <ScheduleModal 
                visible={isModalVisible}
                onClose={() => {
                    setIsModalVisible(false);
                }} 
                onUpdate={(scheduled: InterviewType) => {      
                    setInterviews(prev => [scheduled, ...prev]);
                }}
                COMMITTEES={COMMITTEES}
                POSITIONS={POSITIONS}
            />
            
            <DetailsModal 
                visible={showInterviewDetails}
                selectedInterview={selectedInterview}
                onClose={() => setShowInterviewDetails(false)} 
                onUpdate={(updatedInterview: InterviewType) => {      
                    setInterviews(prev => 
                        prev.map(int => int.id === updatedInterview.id ? updatedInterview : int)
                    );
                }}
                COMMITTEES={COMMITTEES}
                POSITIONS={POSITIONS}
            />
                   
            
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        flex: 1,
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
    headerText:{
        fontSize: 24,
        fontWeight: 'bold',
    },
    header:{
        flexDirection:"row",
        alignItems:'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    headerLeft:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    activeText:{
         fontSize: 16,
         fontWeight: 'bold',
         paddingBottom: 5,
    },
    
    inactiveText:{
        fontSize: 16,
        paddingBottom: 5,
        fontWeight:'normal',
        color: '#666'
    },
    activeOption:{
        borderBottomWidth: 4,
        borderColor:"#E9435E",
    },
    options:{
        flexDirection: 'row',
        gap: 20,
        alignItems: 'center',
    },
    optionsContainer:{
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 60
    },
    saveButton: {
        fontSize: 16,
        color: '#E9435E',
        fontWeight: 'bold',
    },
    
    interviewCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    candidateName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    scheduledBadge: {
        backgroundColor: '#E9435E',
    },
    loggedBadge: {
        backgroundColor: '#E9435E',
    },
    notLoggedBadge: {
        backgroundColor: 'lightblue',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'white',
    },
    position: {
        fontSize: 16,
        fontWeight: '500',
        color: '#555',
        marginBottom: 4,
    },
    committee: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeText: {
        fontSize: 14,
        color: '#666',
    },
    filterContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    filterToggle: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeFilterButton: {
        backgroundColor: '#E9435E',
    },
    filterText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#fff',
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 8,
    },
    centerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    interviewsList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    cardHeaderBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    }
});

export default Interview;