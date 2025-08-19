import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NavBar from '../../components/Navbar';
import { StatusMessage } from '../../components/StatusMessage';
import CreateUserModal from './CreateUserModal';

import { useAccountRequests, useCreateUserFromRequest, useDeleteUser, useRejectAccountRequest, useUsers } from '@/src/hooks/useUsers';
import { AccountRequestDTO, UserType } from '../../types/User';

const Users = () => {
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [expandedCommittees, setExpandedCommittees] = useState<Set<string>>(new Set());

    
    // Status message state
    const [showStatus, setShowStatus] = useState(false);
    const [loading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    const deleteUserMutation = useDeleteUser();
    const createUserFromRequestMutation = useCreateUserFromRequest();
    const rejectRequestMutation = useRejectAccountRequest();

    const { 
        data: users = [], 
        isLoading: isLoadingUsers,
        error: errorUsers, 
        refetch: refetchUsers,
        isFetching: isFetchingUsers
    } = useUsers();

    const { 
        data: accountRequests = [],
        isLoading: isLoadingAccountRequests,
        error: errorAccountRequests,
        refetch: refetchAccountRequests,
        isFetching: isFetchingAccountRequests
    } = useAccountRequests();

    const confirmDeleteUser = (user: UserType) => {
        Alert.alert(
            "Delete User",
            `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteUser(user.id)
                }
            ]
        );
    };

    const deleteUser = async (userId: number) => {
        setIsLoading(true);
        setShowStatus(true);
        setStatusMessage("Deleting user...");

        deleteUserMutation.mutate({ userId }, {
            onSuccess: () => {
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("User deleted successfully!");
                setTimeout(() => setShowStatus(false), 2500);
            },
            onError: () => {
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error deleting user!");
                setTimeout(() => setShowStatus(false), 2500);
            }
        });
    };

    const handleCreateUserFromRequest = async (request: AccountRequestDTO) => {
        setIsLoading(true);
        setShowStatus(true);
        setStatusMessage("Creating user from request...");

        createUserFromRequestMutation.mutate({ request }, {
            onSuccess: () => {
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("User created successfully from request!");
                setTimeout(() => setShowStatus(false), 2500);
            },
            onError: () => {
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error creating user from request!");
                setTimeout(() => setShowStatus(false), 2500);
            }
        });
    };

    const handleRejectRequest = async (requestId: number) => {
        Alert.alert(
            "Reject Request",
            "Are you sure you want to reject this account request?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reject",
                    style: "destructive",
                    onPress: () => {
                        setIsLoading(true);
                        setShowStatus(true);
                        setStatusMessage("Rejecting request...");

                        rejectRequestMutation.mutate({ requestId }, {
                            onSuccess: () => {
                                setIsLoading(false);
                                setIsSuccess(true);
                                setResultMessage("Request rejected successfully!");
                                setTimeout(() => setShowStatus(false), 2500);
                            },
                            onError: () => {
                                setIsLoading(false);
                                setIsSuccess(false);
                                setResultMessage("Error rejecting request!");
                                setTimeout(() => setShowStatus(false), 2500);
                            }
                        });
                    }
                }
            ]
        );
    };

    const handleCreateUser = () => {
        setIsCreateModalVisible(true);
    };

    const getRoleColor = (role: string) => {
        const colors: { [key: string]: string } = {
            'PRESIDENT': '#9B59B6',
            'VICE_PRESIDENT': '#8E44AD',
            'EXECUTIVE_OFFICER': '#3498DB',
            'CHAIRPERSON': '#27AE60',
            'ASSOCIATE_CHAIRPERSON': '#F39C12',
            'LEADER': '#2ECC71',
            'ASSOCIATE_LEADER': '#F1C40F',
            'OFFICER': '#E74C3C',
            'MEMBER': '#95A5A6',
        };
        return colors[role.toUpperCase()] || '#95A5A6';
    };

    const formatRole = (role: string) => {
        return role.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    const getFilteredUsers = () => {
        if (!searchText.trim()) return users;
        
        const searchLower = searchText.toLowerCase();
        return users.filter(user => 
            user.firstName.toLowerCase().includes(searchLower) ||
            user.lastName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.role.toLowerCase().includes(searchLower) ||
            user.committeeName.toLowerCase().includes(searchLower) ||
            (user.subcommitteeName && user.subcommitteeName.toLowerCase().includes(searchLower))
        );
    };

    const getFilteredGroupedUsers = () => {
        const filteredUsers = getFilteredUsers();
        return filteredUsers.reduce((groups: { [key: string]: UserType[] }, user) => {
            const committee = user.committeeName;
            if (!groups[committee]) {
                groups[committee] = [];
            }
            groups[committee].push(user);
            return groups;
        }, {});
    };

    const toggleCommitteeExpansion = (committeeName: string) => {
        const newExpanded = new Set(expandedCommittees);
        if (newExpanded.has(committeeName)) {
            newExpanded.delete(committeeName);
        } else {
            newExpanded.add(committeeName);
        }
        setExpandedCommittees(newExpanded);
    };

    const renderUserItem = ({ item }: { item: UserType }) => {
        return (
            <View style={styles.userCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                            {item.firstName} {item.lastName}
                        </Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
                        <Text style={styles.roleText}>{formatRole(item.role)}</Text>
                    </View>
                </View>
                
                {item.subcommitteeName && (
                    <View style={styles.userMeta}>
                        <View style={styles.metaItem}>
                            <Ionicons name="people-outline" size={16} color="#666" />
                            <Text style={styles.metaText}>{item.subcommitteeName}</Text>
                        </View>
                    </View>
                )}
                
                <View style={styles.cardFooter}>
                    <Text style={styles.userIdText}>ID: {item.id}</Text>
                    <TouchableOpacity 
                        onPress={() => confirmDeleteUser(item)}
                        style={styles.deleteButton}
                        disabled={item.committeeId === 2} // Prevent deletion of admin user
                    >
                        <Ionicons name="trash-outline" size={20} color={item.committeeId === 2 ? "#999" : "#ff4444"}/>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderCommitteeSection = (committeeName: string, committeeUsers: UserType[]) => {
        const isExpanded = expandedCommittees.has(committeeName);
        
        return (
            <View key={committeeName} style={styles.sectionContainer}>
                <TouchableOpacity 
                    style={styles.sectionHeader}
                    onPress={() => toggleCommitteeExpansion(committeeName)}
                >
                    <View style={styles.sectionHeaderLeft}>
                        <Text style={styles.sectionTitle}>{committeeName}</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{committeeUsers.length}</Text>
                        </View>
                    </View>
                    <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#666" 
                    />
                </TouchableOpacity>
                
                {isExpanded && (
                    <View style={styles.sectionContent}>
                        <FlatList
                            data={committeeUsers}
                            renderItem={renderUserItem}
                            keyExtractor={(item) => item.id.toString()}
                            scrollEnabled={false}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    </View>
                )}
            </View>
        );
    };

    const filteredGroupedUsers = getFilteredGroupedUsers();
    const totalFilteredUsers = Object.values(filteredGroupedUsers).flat().length;

    return (
        <SafeAreaView style={styles.container}>
            <NavBar />
            <ScrollView 
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl 
                    refreshing={(isFetchingAccountRequests || isFetchingUsers)} 
                    onRefresh={() => {
                        refetchUsers();
                        refetchAccountRequests();
                    }}
                    tintColor="#E9435E"
                    colors={["#E9435E"]}
                    />
                }
                >
                <View style={styles.header}>
                    <Text style={styles.headerText}>User Management</Text>
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={handleCreateUser}>
                            <Ionicons name="person-add-outline" size={28} color='#E9435E' />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Search users by name, email, role, or committee..."
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
                            {searchText ? totalFilteredUsers : users.length}
                        </Text>
                        <Text style={styles.statLabel}>
                            {searchText ? 'Found Users' : 'Total Users'}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {Object.keys(filteredGroupedUsers).length}
                        </Text>
                        <Text style={styles.statLabel}>
                            {searchText ? 'Matching Committees' : 'Committees'}
                        </Text>
                    </View>
                </View>

                {/* User Sections by Committee */}
                <View style={styles.usersContainer}>
                    {Object.keys(filteredGroupedUsers).length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>
                                {searchText ? 'No users found' : 'No users found'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {searchText ? 'Try adjusting your search terms' : 'Create your first user to get started'}
                            </Text>
                        </View>
                    ) : (
                        Object.entries(filteredGroupedUsers).map(([committeeName, committeeUsers]) =>
                            renderCommitteeSection(committeeName, committeeUsers)
                        )
                    )}
                </View>

                {/* Account Requests Section */}
                {accountRequests.length > 0 && (
                    <View style={styles.accountRequestsContainer}>
                        <Text style={styles.sectionTitle}>Pending Account Requests</Text>
                        {accountRequests.map(request => (
                            <View key={request.id} style={styles.requestCard}>
                                <View style={styles.requestHeader}>
                                    <Text style={styles.requestName}>
                                        {request.firstName} {request.lastName}
                                    </Text>
                                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(request.role) }]}>
                                        <Text style={styles.roleText}>{formatRole(request.role)}</Text>
                                    </View>
                                </View>
                                
                                <Text style={styles.requestEmail}>{request.email}</Text>
                                <Text style={styles.requestCommittee}>
                                    {request.committeeName}
                                    {request.subcommitteeName && ` • ${request.subcommitteeName}`}
                                </Text>
                                
                                <View style={styles.requestActions}>
                                    <TouchableOpacity 
                                        style={styles.createButton}
                                        onPress={() => handleCreateUserFromRequest(request)}
                                    >
                                        <Ionicons name="checkmark-circle" size={20} color="white" />
                                        <Text style={styles.createButtonText}>Create User</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={styles.rejectButton}
                                        onPress={() => handleRejectRequest(request.id)}
                                    >
                                        <Ionicons name="close-circle" size={20} color="white" />
                                        <Text style={styles.rejectButtonText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
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

            {(isLoadingUsers || isLoadingAccountRequests )&& !isCreateModalVisible && !showStatus && (
                <View style={styles.statusOverlay}>
                    <StatusMessage 
                    isLoading={true}
                    isSuccess={false}
                    loadingMessage="Loading users..."
                    resultMessage=""
                    />
                </View>
            )}

            {(errorUsers || errorAccountRequests) && !isCreateModalVisible && !showStatus && (
                <View style={styles.errorContainer}>
                    <StatusMessage 
                    isLoading={false}
                    isSuccess={false}
                    loadingMessage=""
                    resultMessage="Error loading data. Pull to retry."
                    />
                </View>
            )}

            <CreateUserModal 
                visible={isCreateModalVisible}
                onClose={() => setIsCreateModalVisible(false)} 
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
    usersContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    sectionContainer: {
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    countBadge: {
        backgroundColor: '#E9435E',
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
    sectionContent: {
        padding: 16,
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    userInfo: {
        flex: 1,
        marginRight: 12,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: '#666',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '600',
        color: 'white',
    },
    userMeta: {
        marginBottom: 8,
        gap: 4,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: '#666',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    userIdText: {
        fontSize: 10,
        color: '#999',
        fontWeight: '500',
    },
    deleteButton: {
        padding: 2,
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
    accountRequestsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        marginBottom: 20,
    },
    requestCard: {
        backgroundColor: '#fff7e6',
        borderRadius: 12,
        padding: 16,
        marginTop:15,
        borderWidth: 1,
        borderColor: '#ffd700',
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    requestName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    requestEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    requestCommittee: {
        fontSize: 12,
        color: '#888',
        marginBottom: 12,
    },
    requestActions: {
        flexDirection: 'row',
        gap: 8,
    },
    createButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#27AE60',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 4,
    },
    createButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    rejectButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E74C3C',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 4,
    },
    rejectButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default Users;