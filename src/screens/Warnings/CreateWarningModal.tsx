import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { StatusMessage } from '../../components/StatusMessage';
import { UserType } from '../../types/User';

import { useUsers } from '@/src/hooks/useUsers';
import { useCreateWarning } from '@/src/hooks/useWarnings';
import { WarningRequest } from '../../types/Warning';
const CreateWarningModal = ({ visible, onClose}: {
    visible: boolean;
    onClose: () => void;
}) => {
    
    const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
    const [userSearchText, setUserSearchText] = useState('');
    
    const [formData, setFormData] = useState<WarningRequest>({
        assigneeId: 0,
        reason: '',
        actionTaken: '',
        severity: 'LOW'
    });
    
    // Status message state
    const [showStatus, setShowStatus] = useState(false);
    const [loading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    const {
        mutate: createWarningMutate,
    } = useCreateWarning();

    const {
        data: users = [],
        isLoading,
        error,
        refetch,
        isFetching
    } = useUsers();
  

    useEffect(() => {
        if (!users || users.length === 0) {
            setFilteredUsers([]);
            return;
        }
        // Filter users based on search text
        if (userSearchText.trim()) {
            const searchLower = userSearchText.toLowerCase();
            const filtered = users.filter(user => 
                user.firstName.toLowerCase().includes(searchLower) ||
                user.lastName.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower) ||
                user.committeeName.toLowerCase().includes(searchLower) ||
                (user.subcommitteeName && user.subcommitteeName.toLowerCase().includes(searchLower))
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [userSearchText, users]);

    const updateFormData = (field: keyof WarningRequest, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCloseModal = () => {
        // Reset form
        setFormData({
            assigneeId: 0,
            reason: '',
            actionTaken: '',
            severity: 'LOW'
        });
        setUserSearchText('');
        onClose();
    };

    const handleCreateWarning = () => {
        if (!formData.assigneeId || !formData.reason.trim()) {
            Alert.alert('Error', 'Please select a user and provide a reason for the warning');
            return;
        }
        if (formData.reason.length > 1000) {
            Alert.alert('Error', 'Reason cannot exceed 1000 characters');
            return;
        }
        if (formData.actionTaken && formData.actionTaken.length > 500) {
            Alert.alert('Error', 'Action taken cannot exceed 500 characters');
            return;
        }

        const requestBody = {
            assigneeId: formData.assigneeId,
            reason: formData.reason.trim(),
            actionTaken: formData.actionTaken?.trim() || null,
            severity: formData.severity,
        };

        console.log('Creating warning with data:', requestBody);

        setIsLoading(true);
        setStatusMessage("Creating warning...");
        setShowStatus(true);

        createWarningMutate(requestBody, {
                onSuccess: (newWarning) => {
                    console.log('Warning created successfully:', newWarning);
                    setIsLoading(false);
                    setIsSuccess(true);
                    setResultMessage("Warning created successfully!");
                    setTimeout(() => {
                        setShowStatus(false);
                        handleCloseModal();
                    }, 3000);
                },
                onError: (error: any) => {
                    console.error('Error creating warning:', error);
                    setIsLoading(false);
                    setIsSuccess(false);
                    setResultMessage("Error creating warning, please try again");
                    setTimeout(() => {
                        setShowStatus(false);
                    }, 3000);
                }
            });
    };


    const SEVERITY_OPTIONS = [
        { label: 'Low', value: 'LOW' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'High', value: 'HIGH' },
        { label: 'Critical', value: 'CRITICAL' }
    ];

    const getUserOptions = () => {
        return filteredUsers.map(user => ({
            label: `${user.firstName} ${user.lastName} - ${user.committeeName}${user.subcommitteeName ? ` (${user.subcommitteeName})` : ''}`,
            value: user.id
        }));
    };

    const getSelectedUserName = () => {
        const selectedUser = users.find(user => user.id === formData.assigneeId);
        return selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : '';
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

    const creatingDisabled = showStatus || loading || isLoading || users.length === 0;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={showStatus ? () => {} : handleCloseModal}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity 
                        onPress={creatingDisabled ? () => {} : handleCloseModal} 
                        disabled={creatingDisabled}
                    >
                        <Ionicons name="close" size={24} color={showStatus ? "#ccc" : "#666"} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Create Warning</Text>
                    <TouchableOpacity 
                        onPress={creatingDisabled ? undefined : handleCreateWarning} 
                        disabled={creatingDisabled}
                    >
                        <Text style={[styles.saveButton, creatingDisabled && styles.disabledText]}>Create</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    style={styles.modalContent} 
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching}
                            onRefresh={refetch}
                            colors={['#E9435E']}
                            tintColor="#E9435E"
                        />
                    }
                >
                    
                    {/* User Selection */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Select User</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        
                        {/* User Search */}
                        <View style={styles.searchContainer}>
                            <View style={styles.searchInputContainer}>
                                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    value={userSearchText}
                                    onChangeText={setUserSearchText}
                                    placeholder="Search users by name, email, or committee..."
                                    placeholderTextColor="#999"
                                />
                                {userSearchText.length > 0 && (
                                    <TouchableOpacity 
                                        onPress={() => setUserSearchText('')}
                                        style={styles.clearButton}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.pickerContainer}>
                            <RNPickerSelect
                                onValueChange={(value) => updateFormData('assigneeId', value)}
                                items={getUserOptions()}
                                value={formData.assigneeId}
                                placeholder={{ label: "Select user to warn...", value: "0" }}
                                style={pickerSelectStyles}
                                Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
                            />
                        </View>
                        
                        {formData.assigneeId !== 0 && (
                            <View style={styles.selectedUserContainer}>
                                <Text style={styles.selectedUserText}>
                                    Selected: {getSelectedUserName()}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Warning Reason */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Warning Reason</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.reason}
                            onChangeText={(value) => updateFormData('reason', value)}
                            placeholder="Describe the reason for this warning..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            maxLength={1000}
                        />
                        <Text style={styles.characterCount}>
                            {formData.reason.length}/1000 characters
                        </Text>
                    </View>

                    {/* Severity */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Severity Level</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <View style={styles.pickerContainer}>
                            <RNPickerSelect
                                onValueChange={(value) => updateFormData('severity', value)}
                                items={SEVERITY_OPTIONS}
                                value={formData.severity}
                                style={pickerSelectStyles}
                                Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
                            />
                        </View>
                        <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(formData.severity) }]}>
                            <Text style={styles.severityText}>{formData.severity}</Text>
                        </View>
                    </View>

                    {/* Action Taken */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Action Taken</Text>
                            <Text style={styles.labelOptional}>(Optional)</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.actionTaken}
                            onChangeText={(value) => updateFormData('actionTaken', value)}
                            placeholder="Describe any actions taken or consequences..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={3}
                            maxLength={500}
                        />
                        <Text style={styles.characterCount}>
                            {formData.actionTaken?.length || 0}/500 characters
                        </Text>
                    </View>

                </ScrollView>

                {showStatus && (
                    <View style={styles.statusOverlay}>
                        <StatusMessage 
                            isLoading={loading}
                            isSuccess={isSuccess}
                            loadingMessage={statusMessage}
                            resultMessage={resultMessage}
                        />
                    </View>
                )}

                {isLoading && (
                    <View style={styles.statusOverlay}>
                        <StatusMessage 
                            isLoading={true}
                            isSuccess={false}
                            loadingMessage={"Loading users..."}
                            resultMessage={""}
                        />
                    </View>
                )}
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={{color: 'red'}}>Error loading data. Please try again later.</Text>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    errorContainer: {
        padding: 20,
        backgroundColor: '#ffebee',
        margin: 10,
        borderRadius: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        flexDirection: "row",
        gap: 5,
        alignItems: "center",
        marginBottom: 8,
    },
    labelRequirement: {
        color: "red",
        fontSize: 16
    },
    labelOptional: {
        color: "#666",
        fontSize: 12,
        fontStyle: 'italic'
    },
    labelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    characterCount: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        marginTop: 4,
    },
    searchContainer: {
        marginBottom: 8,
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
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    selectedUserContainer: {
        backgroundColor: '#e8f5e8',
        padding: 8,
        borderRadius: 8,
        marginTop: 8,
    },
    selectedUserText: {
        fontSize: 14,
        color: '#27AE60',
        fontWeight: '500',
    },
    severityIndicator: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 8,
    },
    severityText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveButton: {
        fontSize: 16,
        color: '#E9435E',
        fontWeight: 'bold',
    },
    disabledText: {
        color: '#ccc',
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
});

const pickerSelectStyles = {
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    placeholder: {
        color: '#999',
        fontSize: 16,
    },
    iconContainer: {
        right: 15,
        top: 13
    }
};

export default CreateWarningModal;