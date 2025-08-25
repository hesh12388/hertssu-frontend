import { useAuth } from '@/App';
import { useAllProposals, useCrossCommitteeRequests, useMyProposals } from '@/src/hooks/useProposals';
import { CrossCommitteeRequestType, ProposalType } from '@/src/types/Proposal';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
   
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    
    const [selectedProposal, setSelectedProposal] = useState<ProposalType | null>(null);
    const [showProposalDetails, setShowProposalDetails] = useState(false);
    const [selectedCrossCommitteeRequest, setSelectedCrossCommitteeRequest] = useState<CrossCommitteeRequestType | null>(null);
    const [showCrossCommitteeRequestDetails, setShowCrossCommitteeRequestDetails] = useState(false);
   
   
    const { 
        data: myProposals = [], 
        isLoading: isLoadingMy, 
        error: errorMy,
        refetch: refetchMy,
        isFetching: isFetchingMyProposals
    } = useMyProposals(permissions.showMyProposals || permissions.showAssignedProposals);

    const { 
        data: allProposals = [], 
        isLoading: isLoadingAll, 
        error: errorAll,
        refetch: refetchAll,
        isFetching: isFetchingAllProposals
    } = useAllProposals(permissions.showAllProposals);

    const { 
        data: crossCommitteeRequests = [], 
        isLoading: isLoadingCross, 
        error: errorCross,
        refetch: refetchCross ,
        isFetching: isFetchingCrossCommitteeRequests
    } = useCrossCommitteeRequests(permissions.showCrossCommitteeRequests);

    const assignedProposals = myProposals;

    const isLoading = isLoadingMy || isLoadingAll || isLoadingCross;
    const hasError = errorMy || errorAll || errorCross;
    const isFetching = isFetchingMyProposals || isFetchingAllProposals || isFetchingCrossCommitteeRequests;

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

    const handleCreateProposal = () => {
        setIsCreateModalVisible(true);
    };;

    const openProposalDetails = (proposal: ProposalType) => {
        console.log('Opening proposal details:', proposal);
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
            <NavBar />
            <ScrollView 
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl 
                        refreshing={isFetching} 
                        onRefresh={() => {
                            if (permissions.showMyProposals || permissions.showAssignedProposals) refetchMy();
                            if (permissions.showAllProposals) refetchAll();
                            if (permissions.showCrossCommitteeRequests) refetchCross();
                        }}
                    tintColor="#E9435E"
                    colors={["#E9435E"]}
                    />
                }
            >
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
            />

            <ProposalDetailsModal 
                visible={showProposalDetails}
                selectedProposal={selectedProposal}
                onClose={() => setShowProposalDetails(false)} 
            />

            <CrossCommitteeRequestDetailsModal 
                visible={showCrossCommitteeRequestDetails}
                selectedRequest={selectedCrossCommitteeRequest}
                onClose={() => setShowCrossCommitteeRequestDetails(false)} 
            />

            {isLoading && !isCreateModalVisible && (
                <View style={styles.statusOverlay}>
                    <StatusMessage 
                    isLoading={true}
                    isSuccess={false}
                    loadingMessage="Loading proposals..."
                    resultMessage=""
                    />
                </View>
            )}

            {hasError && !isCreateModalVisible && (
                <View style={styles.errorContainer}>
                    <Text style={{color: 'red'}}>Error loading data. Please try again later.</Text>
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
    errorContainer: {
        padding: 20,
        backgroundColor: '#ffebee',
        margin: 10,
        borderRadius: 8,
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