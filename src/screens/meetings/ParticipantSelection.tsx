import { useUsers } from '@/src/hooks/useUsers';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusMessage } from '../../components/StatusMessage';

interface ParticipantSelectionScreenProps {
    visible: boolean;
    onClose: () => void;
    selectedParticipantIds: number[];
    onParticipantsChange: (participantIds: number[]) => void;
    creatorId: number
}

const ParticipantSelectionScreen: React.FC<ParticipantSelectionScreenProps> = ({
    visible,
    onClose,
    selectedParticipantIds,
    onParticipantsChange,
    creatorId
}) => {
    const [searchText, setSearchText] = useState('');
    
    const { 
        data: users = [], 
        isLoading: loadingUsers, 
        error: errorUsers, 
        refetch: refetchUsers,
        isFetching: isFetchingUsers
    } = useUsers();

    const getFilteredUsers = () => {
        let filtered = users;
        
        if (searchText) {
            filtered = users.filter(user => 
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchText.toLowerCase()) ||
                user.email.toLowerCase().includes(searchText.toLowerCase())
            );
        }
        
        // Show selected users first
        const selectedUsers = filtered.filter(user => selectedParticipantIds.includes(user.id) || user.id === creatorId);
        const unselectedUsers = filtered.filter(user => !(selectedParticipantIds.includes(user.id) || user.id === creatorId));
        
        return [...selectedUsers, ...unselectedUsers];
    };

    const toggleParticipant = (userId: number) => {
        const newSelectedIds = selectedParticipantIds.includes(userId)
            ? selectedParticipantIds.filter(id => id !== userId)
            : [...selectedParticipantIds, userId];
        
        onParticipantsChange(newSelectedIds);
    };

    const handleDone = () => {
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.cancelButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Select Participants</Text>
                    <TouchableOpacity onPress={handleDone}>
                        <Text style={styles.doneButton}>Done</Text>
                    </TouchableOpacity>
                </View>

                {/* Selected count */}
                {selectedParticipantIds.length > 0 && (
                    <View style={styles.selectedCountContainer}>
                        <Text style={styles.selectedCount}>
                            {selectedParticipantIds.length} participant{selectedParticipantIds.length === 1 ? '' : 's'} selected
                        </Text>
                    </View>
                )}

                {/* Search Input */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Search participants..."
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>
                
                {/* User List */}
                <ScrollView 
                    style={styles.usersList}
                    refreshControl={
                        <RefreshControl 
                            refreshing={isFetchingUsers} 
                            onRefresh={() => refetchUsers()}
                            tintColor="#E9435E"
                            colors={["#E9435E"]}
                        />
                    }
                >
                    {getFilteredUsers().length === 0 ? (
                        <View style={styles.noUsersContainer}>
                            <Ionicons name="people-outline" size={48} color="#ccc" />
                            <Text style={styles.noUsersText}>
                                {users.length === 0 ? 'No users available' : 'No users found'}
                            </Text>
                        </View>
                    ) : (
                        getFilteredUsers().map((user) => (
                            <TouchableOpacity
                                key={user.id}
                                style={styles.userItem}
                                onPress={() => toggleParticipant(user.id)}
                                disabled={user.id === creatorId}
                            >
                                <View style={styles.userAvatar}>
                                    <Text style={styles.avatarText}>
                                        {user.firstName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
                                    <Text style={styles.userEmail}>{user.email}</Text>
                                </View>
                                <View style={[
                                    styles.checkbox,
                                    selectedParticipantIds.includes(user.id) && styles.checkboxSelected,
                                    user.id === creatorId && styles.disabledcheckbox
                                ]}>
                                    {(selectedParticipantIds.includes(user.id) || user.id === creatorId)&& (
                                        <Ionicons name="checkmark" size={16} color="white" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>

                {loadingUsers && (
                    <View style={styles.statusOverlay}>
                        <StatusMessage 
                            isLoading={true}
                            isSuccess={false}
                            loadingMessage="Loading users..."
                            resultMessage=""
                        />
                    </View>
                )}
                
                {errorUsers && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Error loading users. Please try again later.</Text>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    cancelButton: {
        fontSize: 16,
        color: '#666',
    },
    doneButton: {
        fontSize: 16,
        color: '#E9435E',
        fontWeight: '600',
    },
    selectedCountContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#f8f9fa',
    },
    selectedCount: {
        fontSize: 14,
        color: '#E9435E',
        fontWeight: '500',
        textAlign: 'center',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    usersList: {
        flex: 1,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E9435E',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
    },
    checkboxSelected: {
        backgroundColor: '#E9435E',
        borderColor: '#E9435E',
    },
    disabledcheckbox: {
        backgroundColor: '#999',
        borderColor: '#999',
    },
    noUsersContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    noUsersText: {
        fontSize: 16,
        color: '#999',
        marginTop: 15,
        textAlign: 'center',
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
    errorText: {
        color: 'red',
        textAlign: 'center',
    },
});

export default ParticipantSelectionScreen;