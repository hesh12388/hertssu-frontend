import { useAuth } from '@/App';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NavBar from '../../components/Navbar';
import { StatusMessage } from '../../components/StatusMessage';
import UserProfileModal from './UserProfileModal';

import { useQuery } from '@tanstack/react-query';
import { AssignableUserType } from '../../types/Task';


const TeamSearch = () => {
    const [searchText, setSearchText] = useState('');

    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
    
    const { api } = useAuth()!;
   
    
    const { 
        data: users = [], 
        isLoading, 
        error, 
        refetch,
        isFetching 
    } = useQuery({
        queryKey: ['assignableUsers'],
        queryFn: async (): Promise<AssignableUserType[]>=> {
            const response = await api.get('/users/assignable');
            return response.data || [];
        },
        staleTime: 10 * 60 * 1000,
    });

    const onRefresh = async () => {
        await refetch();
    };

    const handleUserPress = (userId: number) => {
        setSelectedUserId(userId);
        setIsProfileModalVisible(true);
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
            user.role.toLowerCase().includes(searchLower)
        );
    };

    const getRoleColor = (role: string) => {
        const colors: { [key: string]: string } = {
            'PRESIDENT': '#E74C3C',
            'VICE_PRESIDENT': '#E67E22',
            'SECRETARY': '#3498DB',
            'TREASURER': '#27AE60',
            'COMMITTEE_HEAD': '#9B59B6',
            'MEMBER': '#95A5A6'
        };
        return colors[role] || '#95A5A6';
    };

    const renderUserItem = ({ item }: { item: AssignableUserType }) => {
        return (
            <TouchableOpacity 
                style={styles.userCard}
                onPress={() => handleUserPress(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.userInfo}>
                    <View style={styles.userHeader}>
                        <Text style={styles.userName}>
                            {item.firstName} {item.lastName}
                        </Text>
                        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
                            <Text style={styles.roleText}>{formatRole(item.role)}</Text>
                        </View>
                    </View>
                    <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
        );
    };

    const filteredUsers = getFilteredUsers();

    return (
        <SafeAreaView style={styles.container}>
            <NavBar />
            <ScrollView 
                keyboardShouldPersistTaps="handled"
                 refreshControl={
                    <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.headerText}>Team Search</Text>
                    <View style={styles.headerRight}>
                        <Ionicons name="people-outline" size={28} color='#E9435E' />
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
                            placeholder="Search team members by name, email, or role..."
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
                            {searchText ? filteredUsers.length : users.length}
                        </Text>
                        <Text style={styles.statLabel}>
                            {searchText ? 'Found' : 'Total'} Members
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {new Set(users.map(u => u.role)).size}
                        </Text>
                        <Text style={styles.statLabel}>
                            Different Roles
                        </Text>
                    </View>
                </View>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                    <View style={styles.instructionItem}>
                        <Ionicons name="information-circle-outline" size={16} color="#666" />
                        <Text style={styles.instructionText}>
                            Tap on any team member to view their detailed profile
                        </Text>
                    </View>
                </View>

                {/* Users List */}
                <View style={styles.usersContainer}>
                    {filteredUsers.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>
                                {searchText ? 'No team members found' : 'No team members available'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {searchText 
                                    ? 'Try adjusting your search terms' 
                                    : 'Check back later for team member updates'
                                }
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredUsers}
                            renderItem={renderUserItem}
                            keyExtractor={(item) => item.id.toString()}
                            scrollEnabled={false}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    )}
                </View>
            </ScrollView>

            {isLoading && (
                <View style={styles.statusOverlay}>
                    <StatusMessage 
                        isLoading={true}
                        isSuccess={false}
                        loadingMessage="Loading team members..."
                        resultMessage=""
                    />
                </View>
            )}

            {error && (
                <View style={styles.errorContainer}>
                    <StatusMessage 
                        isLoading={false}
                        isSuccess={false}
                        loadingMessage=""
                        resultMessage="Error loading team members!"
                    />
                </View>
            )}

            {selectedUserId && (
                <UserProfileModal 
                    visible={isProfileModalVisible}
                    userId={selectedUserId}
                    onClose={() => {
                        setIsProfileModalVisible(false);
                        setSelectedUserId(null);
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
        marginBottom: 15,
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
    instructionsContainer: {
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    instructionText: {
        fontSize: 13,
        color: '#666',
        flex: 1,
    },
    usersContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userInfo: {
        flex: 1,
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 12,
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
    userEmail: {
        fontSize: 13,
        color: '#666',
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

export default TeamSearch;