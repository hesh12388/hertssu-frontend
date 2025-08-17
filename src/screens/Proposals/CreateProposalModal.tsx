import { useAuth } from '@/App';
import { User } from '@/src/types/User';
import { Ionicons } from '@expo/vector-icons';
import { AxiosInstance } from 'axios';
import React, { useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import RNPickerSelect from 'react-native-picker-select';
import { StatusMessage } from '../../components/StatusMessage';
import { ProposalType } from '../../types/Proposal';
const CreateProposalModal = ({ visible, onClose, onUpdate }: {
    visible: boolean;
    onClose: () => void;
    onUpdate: (proposal: ProposalType) => void;
}) => {
    const { api, user }: { api: AxiosInstance, user: User | null } = useAuth()!;
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigneeId: '',
        dueDate: new Date().toISOString().split('T')[0],
        priority: ''
    });
    
    // Status message state
    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

   
    const ALL_SUBCOMMITTEES = [
        // Events
        { label: 'Continous Events and Trips', value: '1', committeeId: 5 },
        { label: 'Competitions', value: '2', committeeId: 5 },
    ];

    const getAvailableSubcommittees = () => {
        const userCommitteeId = user?.committeeId;
        if (!userCommitteeId) return [];
        
        return ALL_SUBCOMMITTEES.filter(sub => sub.committeeId === userCommitteeId);
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCloseModal = () => {
        setIsCalendarVisible(false);
        // Reset form
        setFormData({
            title: '',
            description: '',
            assigneeId: '',
            dueDate: new Date().toISOString().split('T')[0],
            priority: ''
        });
        onClose();
    };

    const handleCreateProposal = async () => {
        if (!formData.title || !formData.description || !formData.assigneeId || !formData.dueDate || !formData.priority) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setIsLoading(true);
            setStatusMessage("Creating your proposal...");
            setShowStatus(true);

            const requestBody = {
                title: formData.title,
                description: formData.description,
                assigneeId: parseInt(formData.assigneeId),
                dueDate: formData.dueDate,
                priority: formData.priority
            };

            console.log('Creating proposal with data:', requestBody);

            const response = await api.post('/proposals', requestBody);

            if (response.status === 201 || response.status === 200) {
                console.log('Proposal created successfully:', response.data);
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("Proposal created successfully!");
                const newProposal = response.data;
                onUpdate(newProposal);
            } else {
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error creating proposal");
            }

        } catch (error) {
            console.error('Error creating proposal:', error);
            setIsLoading(false);
            setIsSuccess(false);
            setResultMessage("Error creating proposal, please try again");
        } finally {
            setTimeout(() => {
                setShowStatus(false);
                handleCloseModal();
            }, 3000);
        }
    };

    const PRIORITY_OPTIONS = [
        { label: 'Low', value: 'LOW' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'High', value: 'HIGH' }
    ];

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
                    <Text style={styles.modalTitle}>Create New Proposal</Text>
                    <TouchableOpacity 
                        onPress={showStatus ? undefined : handleCreateProposal} 
                        disabled={showStatus}
                    >
                        <Text style={[styles.saveButton, showStatus && styles.disabledText]}>Create</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                    
                    {/* Proposal Title */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Proposal Title</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={formData.title}
                            onChangeText={(value) => updateFormData('title', value)}
                            placeholder="Enter proposal title"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Proposal Description */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Description</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.description}
                            onChangeText={(value) => updateFormData('description', value)}
                            placeholder="Enter proposal description"
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Assignee Selection (Subcommittee) */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Assign To Subcommittee</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <View style={styles.pickerContainer}>
                            <RNPickerSelect
                                onValueChange={(value) => updateFormData('assigneeId', value)}
                                 items={getAvailableSubcommittees()}
                                value={formData.assigneeId}
                                placeholder={{ label: "Select subcommittee...", value: "" }}
                                style={pickerSelectStyles}
                                Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
                            />
                        </View>
                    </View>

                    {/* Priority */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Priority</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <View style={styles.pickerContainer}>
                            <RNPickerSelect
                                onValueChange={(value) => updateFormData('priority', value)}
                                items={PRIORITY_OPTIONS}
                                value={formData.priority}
                                placeholder={{ label: "Select priority...", value: "" }}
                                style={pickerSelectStyles}
                                Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
                            />
                        </View>
                    </View>

                    {/* Due Date */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Due Date</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.dateDisplay} 
                            onPress={() => setIsCalendarVisible(!isCalendarVisible)}
                        >
                            <Text style={styles.dateText}>
                                {new Date(formData.dueDate).toLocaleDateString()}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color="#E9435E" />
                        </TouchableOpacity>
                        
                        {isCalendarVisible && (
                            <Calendar
                                current={formData.dueDate}
                                markedDates={{
                                    [formData.dueDate]: {
                                        selected: true, 
                                        selectedColor: '#E9435E'
                                    }
                                }}
                                onDayPress={day => {
                                    updateFormData('dueDate', day.dateString);
                                    setIsCalendarVisible(false);
                                }}
                                minDate={new Date().toISOString().split('T')[0]}
                                style={{
                                    borderWidth: 2,
                                    borderColor: '#E9435E',
                                    borderRadius: 5,
                                    marginTop: 20
                                }}
                                theme={{
                                    backgroundColor: '#ffffff',
                                    calendarBackground: '#ffffff',
                                    textSectionTitleColor: '#b6c1cd',
                                    selectedDayBackgroundColor: '#E9435E',
                                    selectedDayTextColor: '#ffffff',
                                    dayTextColor: '#2d4150',
                                    todayTextColor: "#E9435E",
                                    textDisabledColor: '#999',
                                    arrowColor: "#E9435E",
                                }}
                            />
                        )}
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
    dateDisplay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    dateText: {
        fontSize: 16,
        color: '#333',
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

export default CreateProposalModal;