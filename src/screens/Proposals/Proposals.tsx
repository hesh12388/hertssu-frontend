import { useAuth } from '@/App';
import { CrossCommitteeRequestType, ProposalType } from '@/src/types/Proposal';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NavBar from '../../components/Navbar';
import { StatusMessage } from '../../components/StatusMessage';
import { usePermissions } from '../../hooks/usePermissions';
import CreateProposalModal from './CreateProposalModal';
import CrossCommitteeRequestDetailsModal from './CrossCommitteeRequestDetailsModal';
import ProposalDetailsModal from './ProposalDetailsModal';
const Proposals = () => {
    const auth = useAuth();
    const permissions = usePermissions(auth?.user ?? null);
    
    const [myProposals, setMyProposals] = useState<ProposalType[]>([]);
    const [assignedProposals, setAssignedProposals] = useState<ProposalType[]>([]);
    const [allProposals, setAllProposals] = useState<ProposalType[]>([]);
    const [crossCommitteeRequests, setCrossCommitteeRequests] = useState<CrossCommitteeRequestType[]>([]);
    
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    
    const [selectedProposal, setSelectedProposal] = useState<ProposalType | null>(null);
    const [showProposalDetails, setShowProposalDetails] = useState(false);
    const [selectedCrossCommitteeRequest, setSelectedCrossCommitteeRequest] = useState<CrossCommitteeRequestType | null>(null);
    const [showCrossCommitteeRequestDetails, setShowCrossCommitteeRequestDetails] = useState(false);
   
    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    useEffect(() => {
        fetchProposals();
    }, []);

     const fetchProposals = async () => {
        try {
            setIsLoading(true);
            setShowStatus(true);
            setStatusMessage("Fetching proposals...");
            
            if (permissions.showMyProposals || permissions.showAssignedProposals) {
                const proposalsResponse = await auth?.api.get('/proposals/my-proposals');
                const proposalsData = proposalsResponse?.data || [];
                
                if (permissions.showMyProposals) {
                    setMyProposals(proposalsData);
                }
                if (permissions.showAssignedProposals) {
                    setAssignedProposals(proposalsData);
                }
            }
            
            if (permissions.showAllProposals) {
                const allProposalsResponse = await auth?.api.get('/proposals/all');
                setAllProposals(allProposalsResponse?.data || []);
            }
            
            if (permissions.showCrossCommitteeRequests) {
                const crossCommitteeResponse = await auth?.api.get('/proposals/cross-committee-requests/for-my-committee');
                setCrossCommitteeRequests(crossCommitteeResponse?.data || []);
            }
            
            setIsSuccess(true);
            setIsLoading(false);
            setResultMessage("Successfully fetched proposals!");
        } catch (error) {
            console.error('Error fetching proposals:', error);
            setIsSuccess(false);
            setIsLoading(false);
            setResultMessage("Error fetching proposals!");
        } finally {
            setTimeout(() => {
                setShowStatus(false);
            }, 2500);
        }
    };

    const getFilteredProposals = (proposals: ProposalType[], status: string) => {
        return proposals.filter(proposal => proposal.status === status);
    };

    const getFilteredCrossCommitteeRequests = (status: string) => {
        return crossCommitteeRequests.filter(request => request.status === status);
    };

    const formatDueDate = (dueDateString: string) => {
        const date = new Date(dueDateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return {
                text: `${Math.abs(diffDays)} days overdue`,
                color: '#F44336'
            };
        } else if (diffDays === 0) {
            return {
                text: 'Due today',
                color: '#FF9800'
            };
        } else if (diffDays === 1) {
            return {
                text: 'Due tomorrow',
                color: '#FF9800'
            };
        } else {
            return {
                text: `Due in ${diffDays} days`,
                color: '#666'
            };
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return '#F44336';
            case 'MEDIUM': return '#FF9800';
            case 'LOW': return '#4CAF50';
            default: return '#666';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'IN_PROGRESS': return '#2196F3';
            case 'PENDING_REVIEW': return '#FF9800';
            case 'COMPLETED': return '#4CAF50';
            default: return '#666';
        }
    };

    const getCommitteeDisplayName = (committee: string) => {
        switch (committee) {
            case 'EVENTS': return 'Entertainment and Events';
            case 'SPORTS': return 'Sports';
            case 'PUBLIC_RELATIONS': return 'Public Relations';
            case 'TREASURY': return 'Treasury';
            default: return committee;
        }
    };

    const handleCreateProposal = () => {
        setIsCreateModalVisible(true);
    };;

    const openProposalDetails = (proposal: ProposalType) => {
        setSelectedProposal(proposal);
        setShowProposalDetails(true);
    };

    const openCrossCommitteeRequestDetails = (request: CrossCommitteeRequestType) => {
        setSelectedCrossCommitteeRequest(request);
        setShowCrossCommitteeRequestDetails(true);
    };;

    const renderProposalItem = ({ item }: { item: ProposalType }) => {
        const dueInfo = formatDueDate(item.dueDate);
        const isAssigner = item.assigner.id === auth?.user?.committeeId

        return (
            <TouchableOpacity 
                style={styles.proposalCard}
                onPress={() => openProposalDetails(item)}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.proposalTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                        <Text style={styles.priorityText}>{item.priority}</Text>
                    </View>
                </View>
                
                <Text style={styles.proposalDescription} numberOfLines={2}>{item.description}</Text>
                
                <View style={styles.proposalMeta}>
                    <Text style={styles.assignmentText}>
                        {isAssigner ? `To: ${item.assignee.committeeName}` : `From: ${item.assigner.committeeName}`}
                    </Text>
                </View>
                
                <View style={styles.cardFooter}>
                    {item.status === 'COMPLETED' ? (
                        <View style={styles.dueDateContainer}>
                            <Ionicons name="checkmark-circle" size={16} color="green" />
                            <Text style={[styles.dueDateText, { color: "green" }]}>
                                Completed
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.dueDateContainer}>
                            <Ionicons name="time-outline" size={16} color={dueInfo.color} />
                            <Text style={[styles.dueDateText, { color: dueInfo.color }]}>
                                {dueInfo.text}
                            </Text>
                        </View>
                    )}
                    
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderCrossCommitteeRequestItem = ({ item }: { item: CrossCommitteeRequestType }) => {
        return (
            <TouchableOpacity 
                style={styles.crossCommitteeCard}
                onPress={() => openCrossCommitteeRequestDetails(item)}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.proposalTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.committeeTag}>
                        <Text style={styles.committeeText}>{item.targetCommittee.committeeName}</Text>
                    </View>
                </View>
                
                <Text style={styles.proposalDescription} numberOfLines={2}>{item.description}</Text>
                
                <View style={styles.proposalMeta}>
                    <Text style={styles.assignmentText}>
                        From: {item.requester.committeeName}
                    </Text>
                </View>
                
                <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderProposalSection = (proposals: ProposalType[], status: string, title: string) => {
        const filteredProposals = getFilteredProposals(proposals, status);
        
        return (
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <View style={[styles.countBadge, { backgroundColor: getStatusColor(status) }]}>
                        <Text style={styles.countText}>{filteredProposals.length}</Text>
                    </View>
                </View>
                
                {filteredProposals.length === 0 ? (
                    <View style={styles.emptySection}>
                        <Text style={styles.emptyText}>No {title.toLowerCase()} proposals</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredProposals}
                        renderItem={renderProposalItem}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                )}
            </View>
        );
    };

    const renderCrossCommitteeSection = (status: string, title: string) => {
        const filteredRequests = getFilteredCrossCommitteeRequests(status);
        
        return (
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <View style={[styles.countBadge, { backgroundColor: getStatusColor(status) }]}>
                        <Text style={styles.countText}>{filteredRequests.length}</Text>
                    </View>
                </View>
                
                {filteredRequests.length === 0 ? (
                    <View style={styles.emptySection}>
                        <Text style={styles.emptyText}>No {title.toLowerCase()} requests</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredRequests}
                        renderItem={renderCrossCommitteeRequestItem}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                )}
            </View>
        );
    };

    // Determine header title based on user role
    const getHeaderTitle = () => {
        if (permissions.showAllProposals) return "All Proposals";
        if (permissions.showAssignedProposals) return "Assigned Proposals";
        if (permissions.showMyProposals) return "My Proposals";
        return "Proposals";
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <NavBar />
                <View style={styles.header}>
                    <Text style={styles.headerText}>{getHeaderTitle()}</Text>
                    <View style={styles.headerRight}>
                        {permissions.canCreateProposals && (
                            <TouchableOpacity onPress={handleCreateProposal}>
                                <Ionicons name="add-circle-outline" size={34} color='#E9435E' />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.proposalsContainer}>
                    {/* Proposals Sections */}
                    {permissions.showMyProposals && (
                        <>
                            <View style={styles.mainSectionHeader}>
                                <Text style={styles.mainSectionTitle}>My Proposals</Text>
                            </View>
                            {renderProposalSection(myProposals, 'IN_PROGRESS', 'In Progress')}
                            {renderProposalSection(myProposals, 'PENDING_REVIEW', 'Pending Review')}
                            {renderProposalSection(myProposals, 'COMPLETED', 'Completed')}
                        </>
                    )}

                    {permissions.showAssignedProposals && (
                        <>
                            <View style={styles.mainSectionHeader}>
                                <Text style={styles.mainSectionTitle}>Assigned Proposals</Text>
                            </View>
                            {renderProposalSection(assignedProposals, 'IN_PROGRESS', 'In Progress')}
                            {renderProposalSection(assignedProposals, 'PENDING_REVIEW', 'Pending Review')}
                            {renderProposalSection(assignedProposals, 'COMPLETED', 'Completed')}
                        </>
                    )}

                    {permissions.showAllProposals && (
                        <>
                            {renderProposalSection(allProposals, 'IN_PROGRESS', 'In Progress')}
                            {renderProposalSection(allProposals, 'PENDING_REVIEW', 'Pending Review')}
                            {renderProposalSection(allProposals, 'COMPLETED', 'Completed')}
                        </>
                    )}

                    {/* Cross-Committee Requests Section */}
                    {permissions.showCrossCommitteeRequests && crossCommitteeRequests.length > 0 && (
                        <>
                            <View style={styles.mainSectionHeader}>
                                <Text style={styles.mainSectionTitle}>Cross-Committee Requests</Text>
                            </View>
                            {renderCrossCommitteeSection('IN_PROGRESS', 'In Progress')}
                            {renderCrossCommitteeSection('PENDING_REVIEW', 'Pending Review')}
                            {renderCrossCommitteeSection('COMPLETED', 'Completed')}
                        </>
                    )}
                </View>
            </ScrollView>
            
            <CreateProposalModal 
                visible={isCreateModalVisible}
                onClose={() => setIsCreateModalVisible(false)} 
                onUpdate={(newProposal: ProposalType) => {      
                    setAssignedProposals(prev => [newProposal, ...prev]);
                }}
            />

            <ProposalDetailsModal 
                visible={showProposalDetails}
                selectedProposal={selectedProposal}
                onClose={() => setShowProposalDetails(false)} 
                onUpdate={(updatedProposal: ProposalType) => {      
                   
                    if (permissions.showMyProposals) {
                        setMyProposals(prev => 
                            prev.map(proposal => proposal.id === updatedProposal.id ? updatedProposal : proposal)
                        );
                    }
                    if (permissions.showAssignedProposals) {
                        setAssignedProposals(prev => 
                            prev.map(proposal => proposal.id === updatedProposal.id ? updatedProposal : proposal)
                        );
                    }
                }}
                onDelete={(proposalId: number) => {
                    setAssignedProposals(prev => prev.filter(proposal => proposal.id !== proposalId));
                }}
            />

            <CrossCommitteeRequestDetailsModal 
                visible={showCrossCommitteeRequestDetails}
                selectedRequest={selectedCrossCommitteeRequest}
                onClose={() => setShowCrossCommitteeRequestDetails(false)} 
            />

            {showStatus && (
                <View style={styles.statusOverlay}>
                    <StatusMessage 
                        isLoading={isLoading}
                        isSuccess={isSuccess}
                        loadingMessage={statusMessage}
                        resultMessage={resultMessage}
                    />
                </View>
            )}
        </SafeAreaView>
    );
};

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
    header: {
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    proposalsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    mainSectionHeader: {
        marginTop: 20,
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: '#E9435E',
    },
    mainSectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#E9435E',
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    countBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 24,
        alignItems: 'center',
    },
    countText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'white',
    },
    proposalCard: {
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
    crossCommitteeCard: {
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
        borderColor: '#e3f2fd',
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    proposalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 12,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'white',
    },
    committeeTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#2196F3',
    },
    committeeText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'white',
    },
    proposalDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        lineHeight: 20,
    },
    proposalMeta: {
        marginBottom: 8,
    },
    assignmentText: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dueDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dueDateText: {
        fontSize: 12,
        fontWeight: '500',
    },
    dateText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'white',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 4,
    },
    emptySection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});

export default Proposals;