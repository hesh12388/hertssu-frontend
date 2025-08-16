import { useAuth } from '@/App';
import { Ionicons } from '@expo/vector-icons';
import { AxiosInstance } from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import RNPickerSelect from 'react-native-picker-select';
import { StatusMessage } from '../../components/StatusMessage';
import { AssignableUserType, getFullName, TaskType } from '../../types/Task';

const CreateTaskModal = ({ visible, onClose, onUpdate }: {
    visible: boolean;
    onClose: () => void;
    onUpdate: (task: TaskType) => void;
}) => {
    const { api }: { api: AxiosInstance } = useAuth()!;
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [assignableUsers, setAssignableUsers] = useState<AssignableUserType[]>([]);
    const [userSearchText, setUserSearchText] = useState('');
    
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

    useEffect(() => {
        if (visible) {
            fetchAssignableUsers();
        }
    }, [visible]);

    const fetchAssignableUsers = async () => {
        try {
            const response = await api.get('/users/assignable');
            setAssignableUsers(response.data || []);
        } catch (error) {
            console.error('Error fetching assignable users:', error);
            Alert.alert('Error', 'Failed to fetch users. Please try again.');
        }
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCloseModal = () => {
        setIsCalendarVisible(false);
        setUserSearchText('');
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

    const handleCreateTask = async () => {
        if (!formData.title || !formData.description || !formData.assigneeId || !formData.dueDate || !formData.priority) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setIsLoading(true);
            setStatusMessage("Creating your task...");
            setShowStatus(true);

            const requestBody = {
                title: formData.title,
                description: formData.description,
                assigneeId: parseInt(formData.assigneeId),
                dueDate: formData.dueDate,
                priority: formData.priority
            };

            console.log('Creating task with data:', requestBody);

            const response = await api.post('/tasks', requestBody);

            if (response.status === 201 || response.status === 200) {
                console.log('Task created successfully:', response.data);
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("Task created successfully!");
                const newTask = response.data;
                onUpdate(newTask);
            } else {
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error creating task");
            }

        } catch (error) {
            console.error('Error creating task:', error);
            setIsLoading(false);
            setIsSuccess(false);
            setResultMessage("Error creating task, please try again");
        } finally {
            setTimeout(() => {
                setShowStatus(false);
                handleCloseModal();
            }, 3000);
        }
    };

    const getFilteredUsers = () => {
        if (!userSearchText) return assignableUsers;
        
        return assignableUsers.filter(user => 
            getFullName(user).toLowerCase().includes(userSearchText.toLowerCase()) ||
            user.email.toLowerCase().includes(userSearchText.toLowerCase())
        );
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
                    <Text style={styles.modalTitle}>Create New Task</Text>
                    <TouchableOpacity 
                        onPress={showStatus ? undefined : handleCreateTask} 
                        disabled={showStatus}
                    >
                        <Text style={[styles.saveButton, showStatus && styles.disabledText]}>Create</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                    
                    {/* Task Title */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Task Title</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={formData.title}
                            onChangeText={(value) => updateFormData('title', value)}
                            placeholder="Enter task title"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Task Description */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Description</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.description}
                            onChangeText={(value) => updateFormData('description', value)}
                            placeholder="Enter task description"
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Assignee Selection */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Assign To</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        
                        {/* Search Input */}
                        <TextInput
                            style={styles.searchInput}
                            value={userSearchText}
                            onChangeText={setUserSearchText}
                            placeholder="Search for a user..."
                            placeholderTextColor="#999"
                        />
                        
                        {/* User List */}
                        <ScrollView style={styles.userListContainer}>
                            {getFilteredUsers().length === 0 ? (
                                <View style={styles.noUsersContainer}>
                                    <Text style={styles.noUsersText}>
                                        {assignableUsers.length === 0 ? 'No users available to assign tasks to' : 'No users found'}
                                    </Text>
                                </View>
                            ) : (
                                getFilteredUsers().slice(0, 5).map((user) => (
                                    <TouchableOpacity
                                        key={user.id}
                                        style={[
                                            styles.userItem,
                                            formData.assigneeId === user.id.toString() && styles.selectedUserItem
                                        ]}
                                        onPress={() => {
                                            updateFormData('assigneeId', user.id.toString());
                                            setUserSearchText('');
                                        }}
                                    >
                                        <View style={styles.userInfo}>
                                            <Text style={styles.userName}>{getFullName(user)}</Text>
                                            <Text style={styles.userEmail}>{user.email}</Text>
                                            <Text style={styles.userRole}>{user.role}</Text>
                                        </View>
                                        {formData.assigneeId === user.id.toString() && (
                                            <Ionicons name="checkmark-circle" size={24} color="#E9435E" />
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
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
    searchInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    userListContainer: {
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectedUserItem: {
        backgroundColor: '#f0f8ff',
        borderColor: '#E9435E',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    userRole: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    noUsersContainer: {
        padding: 20,
        alignItems: 'center',
    },
    noUsersText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
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

export default CreateTaskModal;