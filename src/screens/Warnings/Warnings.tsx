import { useAuth } from '@/App';
import { useDeleteWarning, useWarnings } from '@/src/hooks/useWarnings';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NavBar from '../../components/Navbar';
import { StatusMessage } from '../../components/StatusMessage';
import { usePermissions } from '../../hooks/usePermissions';
import CreateWarningModal from './CreateWarningModal';

interface WarningResponse {
    id: number;
    assigner: UserSummary;
    assignee: UserSummary;
    issuedDate: string;
    reason: string;
    actionTaken?: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    createdAt: string;
    updatedAt?: string;
}

interface UserSummary {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    committee: string;
    subcommittee: string;
}

const Warnings = () => {
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
  
    
    // Status message state
    const [showStatus, setShowStatus] = useState(false);
    const [loading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    const { 
        data: warnings = [], 
        isLoading, 
        error,
        refetch,
        isFetching
    } = useWarnings();


    const auth = useAuth();
    const {
        mutate: deleteWarningMutate,
        isPending: isDeleting,
    } = useDeleteWarning();
    const { isHigherLevel } = usePermissions(auth?.user || null);

 
    const confirmDeleteWarning = (warning: WarningResponse) => {
        Alert.alert(
            "Delete Warning",
            `Are you sure you want to delete this warning for ${warning.assignee.firstName} ${warning.assignee.lastName}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteWarning(warning.id)
                }
            ]
        );
    };

    const deleteWarning = (warningId: number) => {
        setIsLoading(true);
        setShowStatus(true);
        setStatusMessage("Deleting warning...");

        deleteWarningMutate(
            { warningId },
            {
            onSuccess: () => {
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("Warning deleted successfully!");
            },
            onError: (error: any) => {
                console.error('Error deleting warning:', error);
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error deleting warning!");
            },
            onSettled: () => {
                setTimeout(() => setShowStatus(false), 2500);
            },
            }
        );
    };


    const handleCreateWarning = () => {
        setIsCreateModalVisible(true);
    };

    const getSeverityColor = (severity: string) => {
        const colors: { [key: string]: string } = {
            'LOW': '#27AE60',
            'MEDIUM': '#F39C12',
            'HIGH': '#E67E22',
            'CRITICAL': '#E74C3C'
        };
        return colors[severity] || '#27AE60';
    };

    const formatRole = (role: string) => {
        return role.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFilteredWarnings = () => {
        if (!searchText.trim()) return warnings;
        if(!warnings || warnings.length === 0) return [];
        
        const searchLower = searchText.toLowerCase();
        return warnings.filter(warning => 
            warning.assignee.firstName.toLowerCase().includes(searchLower) ||
            warning.assignee.lastName.toLowerCase().includes(searchLower) ||
            warning.assignee.email.toLowerCase().includes(searchLower) ||
            warning.assignee.committee.toLowerCase().includes(searchLower) ||
            warning.assigner.firstName.toLowerCase().includes(searchLower) ||
            warning.assigner.lastName.toLowerCase().includes(searchLower) ||
            warning.reason.toLowerCase().includes(searchLower) ||
            warning.severity.toLowerCase().includes(searchLower) ||
            (warning.actionTaken && warning.actionTaken.toLowerCase().includes(searchLower))
        );
    };

    const renderWarningItem = ({ item }: { item: WarningResponse }) => {
        return (
            <View style={styles.warningCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.warningInfo}>
                        <Text style={styles.assigneeName}>
                            {item.assignee.firstName} {item.assignee.lastName}
                        </Text>
                        <Text style={styles.assigneeDetails}>
                            {item.assignee.committee}
                            {item.assignee.subcommittee && ` • ${item.assignee.subcommittee}`} - {formatRole(item.assignee.role)}
                        </Text>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
                        <Text style={styles.severityText}>{item.severity}</Text>
                    </View>
                </View>
                
                <View style={styles.reasonContainer}>
                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <Text style={styles.reasonText}>{item.reason}</Text>
                </View>
                
                
                <View style={styles.actionContainer}>
                    <Text style={styles.actionLabel}>Action Taken:</Text>
                    <Text style={styles.actionText}>{item.actionTaken}</Text>
                </View>
                
                
                <View style={styles.metaContainer}>
                    <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={14} color="#666" />
                        <Text style={styles.metaText}>
                            Issued by: {item.assigner.firstName} {item.assigner.lastName}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text style={styles.metaText}>
                            {formatDate(item.issuedDate)}
                        </Text>
                    </View>
                </View>
                
                {isHigherLevel && (
                    <View style={styles.cardFooter}>
                        <Text style={styles.warningIdText}>ID: {item.id}</Text>
                        <TouchableOpacity 
                            onPress={() => confirmDeleteWarning(item)}
                            style={styles.deleteButton}
                        >
                            <Ionicons name="trash-outline" size={20} color="#ff4444"/>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const filteredWarnings = getFilteredWarnings();

    return (
        <SafeAreaView style={styles.container}>
            <NavBar />
            <ScrollView 
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl refreshing={isFetching} onRefresh={refetch} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.headerText}>
                        {isHigherLevel ? 'Warning Management' : 'My Warnings'}
                    </Text>
                    {isHigherLevel && (
                        <View style={styles.headerRight}>
                            <TouchableOpacity onPress={handleCreateWarning}>
                                <Ionicons name="warning-outline" size={28} color='#E9435E' />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder={isHigherLevel ? "Search warnings by user, reason, severity..." : "Search your warnings..."}
                            placeholderTextColor="#999"
                            returnKeyType="search"
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity 
                                onPress={() => setSearchText('')}
                                style={styles.clearButton}
                            >
                                <Ionicons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Summary Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {searchText ? filteredWarnings.length : warnings.length}
                        </Text>
                        <Text style={styles.statLabel}>
                            {searchText ? 'Found' : 'Total'} Warnings
                        </Text>
                    </View>
                    {isHigherLevel && (
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>
                                {new Set(warnings.map(w => w.assignee.id)).size}
                            </Text>
                            <Text style={styles.statLabel}>
                                Users with Warnings
                            </Text>
                        </View>
                    )}
                </View>

                {/* Warnings List */}
                <View style={styles.warningsContainer}>
                    {filteredWarnings.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="warning-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>
                                {searchText ? 'No warnings found' : isHigherLevel ? 'No warnings issued yet' : 'No warnings on your record'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {searchText 
                                    ? 'Try adjusting your search terms' 
                                    : isHigherLevel 
                                        ? 'Create your first warning to get started'
                                        : 'Keep up the good work!'
                                }
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredWarnings}
                            renderItem={renderWarningItem}
                            keyExtractor={(item) => item.id.toString()}
                            scrollEnabled={false}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    )}
                </View>
            </ScrollView>

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

            {isLoading && !isCreateModalVisible && !showStatus && (
                <View style={styles.statusOverlay}>
                    <StatusMessage 
                    isLoading={true}
                    isSuccess={false}
                    loadingMessage="Loading warnings..."
                    resultMessage=""
                    />
                </View>
            )}

            {error && !isCreateModalVisible && !showStatus && (
                <View style={styles.errorContainer}>
                    <Text style={{color: 'red'}}>Error loading data. Please try again later.</Text>
                </View>
            )}

            {isHigherLevel && (
                <CreateWarningModal 
                    visible={isCreateModalVisible}
                    onClose={() => setIsCreateModalVisible(false)} 
                    onUpdate={() => {      
                        refetch();
                    }}
                />
            )}
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
        paddingBottom: 10,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 12,
        color: '#333',
    },
    clearButton: {
        padding: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#E9435E',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    warningsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    warningCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    warningInfo: {
        flex: 1,
        marginRight: 12,
    },
    assigneeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    assigneeDetails: {
        fontSize: 13,
        color: '#666',
    },
    severityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    severityText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'white',
    },
    reasonContainer: {
        marginBottom: 12,
    },
    reasonLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    reasonText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    actionContainer: {
        marginBottom: 12,
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 8,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    actionText: {
        fontSize: 13,
        color: '#333',
        lineHeight: 18,
    },
    metaContainer: {
        gap: 6,
        marginBottom: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 12,
        color: '#666',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    warningIdText: {
        fontSize: 10,
        color: '#999',
        fontWeight: '500',
    },
    deleteButton: {
        padding: 2,
    },
    separator: {
        height: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#999',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default Warnings;