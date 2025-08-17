import { useAuth } from '@/App';
import { Ionicons } from '@expo/vector-icons';
import { AxiosInstance } from 'axios';
import React, { useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { StatusMessage } from '../../components/StatusMessage';
import { CrossCommitteeRequestType } from '../../types/Proposal';

const CreateCrossCommitteeRequestModal = ({ 
    visible, 
    proposalId,
    onClose, 
    onUpdate 
}: {
    visible: boolean;
    proposalId: number;
    onClose: () => void;
    onUpdate: (request: CrossCommitteeRequestType) => void;
}) => {
    const { api, user }: { api: AxiosInstance, user: any } = useAuth()!;
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        targetCommitteeId: ''
    });
    
    // Status message state
    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    // Hardcoded committees - exclude user's own committee
    const ALL_COMMITTEES = [
        { label: 'Entertainment and Events', value: '5', id: 5 },
        { label: 'Treasury', value: '3', id: 3 },
        { label: 'Public Relations', value: '4', id: 4 }
    ];

    // Filter out user's own committee
    const getAvailableCommittees = () => {
        const userCommitteeId = user?.committeeId;
        if (!userCommitteeId) return ALL_COMMITTEES;
        
        return ALL_COMMITTEES.filter(committee => committee.id !== userCommitteeId);
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCloseModal = () => {
        setFormData({
            title: '',
            description: '',
            targetCommitteeId: ''
        });
        onClose();
    };

    const handleCreateRequest = async () => {
        if (!formData.title || !formData.description || !formData.targetCommitteeId) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setIsLoading(true);
            setStatusMessage("Creating cross-committee request...");
            setShowStatus(true);

            const requestBody = {
                title: formData.title,
                description: formData.description,
                targetCommitteeId: parseInt(formData.targetCommitteeId)
            };

            console.log('Creating cross-committee request with data:', requestBody);

            const response = await api.post(`/proposals/${proposalId}/cross-committee-requests`, requestBody);

            if (response.status === 201 || response.status === 200) {
                console.log('Cross-committee request created successfully:', response.data);
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("Cross-committee request created successfully!");
                const newRequest = response.data;
                onUpdate(newRequest);
            } else {
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error creating request");
            }

        } catch (error) {
            console.error('Error creating cross-committee request:', error);
            setIsLoading(false);
            setIsSuccess(false);
            setResultMessage("Error creating request, please try again");
        } finally {
            setTimeout(() => {
                setShowStatus(false);
                handleCloseModal();
            }, 3000);
        }
    };

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
                        onPress={showStatus ? () => {} : handleCloseModal} 
                        disabled={showStatus}
                    >
                        <Ionicons name="close" size={24} color={showStatus ? "#ccc" : "#666"} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Create Cross-Committee Request</Text>
                    <TouchableOpacity 
                        onPress={showStatus ? undefined : handleCreateRequest} 
                        disabled={showStatus}
                    >
                        <Text style={[styles.saveButton, showStatus && styles.disabledText]}>Create</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                    
                    {/* Request Title */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Request Title</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={formData.title}
                            onChangeText={(value) => updateFormData('title', value)}
                            placeholder="e.g., Budget Request for Spring Event"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Request Description */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Description</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.description}
                            onChangeText={(value) => updateFormData('description', value)}
                            placeholder="Describe what you need from the target committee..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Target Committee Selection */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Target Committee</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <View style={styles.pickerContainer}>
                            <RNPickerSelect
                                onValueChange={(value) => updateFormData('targetCommitteeId', value)}
                                items={getAvailableCommittees()}
                                value={formData.targetCommitteeId}
                                placeholder={{ label: "Select committee to request from...", value: "" }}
                                style={pickerSelectStyles}
                                Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
                            />
                        </View>
                        {getAvailableCommittees().length === 0 && (
                            <Text style={styles.noCommitteesText}>
                                No other committees available to request from
                            </Text>
                        )}
                    </View>

                    {/* Helper Text */}
                    <View style={styles.helperTextContainer}>
                        <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
                        <Text style={styles.helperText}>
                            This request will be sent to the chairperson and associate chairperson of the selected committee. 
                            They can respond with comments and documents.
                        </Text>
                    </View>

                </ScrollView>

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
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
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
        alignItems: "center"
    },
    labelRequirement: {
        color: "red",
        fontSize: 16
    },
    labelText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
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
        paddingTop: 12,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    saveButton: {
        fontSize: 16,
        color: '#2196F3',
        fontWeight: 'bold',
    },
    disabledText: {
        color: '#ccc',
    },
    noCommitteesText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        marginTop: 8,
        textAlign: 'center',
    },
    helperTextContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
        gap: 12,
        marginTop: 10,
    },
    helperText: {
        fontSize: 14,
        color: '#1976d2',
        lineHeight: 20,
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

export default CreateCrossCommitteeRequestModal;