import { useAuth } from '@/App';
import { useCreateMeeting } from '@/src/hooks/useMeetings';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { StatusMessage } from '../../components/StatusMessage';
import ParticipantSelectionScreen from './ParticipantSelection';

const CreateMeetingModal = ({ visible, onClose }: {
    visible: boolean;
    onClose: () => void;
}) => {
    
    const {user} = useAuth()!;
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [showParticipantSelection, setShowParticipantSelection] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        date: new Date().toISOString().split('T')[0], // yyyy-MM-dd
        startTime: new Date().toTimeString().slice(0, 5),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toTimeString().slice(0, 5),
        isAllDay: false,
        participantIds: [] as number[]
    });
    
    // Status message state
    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    const createMeetingMutation = useCreateMeeting();

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCloseModal = () => {
        setIsCalendarVisible(false);
        setShowParticipantSelection(false);
       
        setFormData({
            title: '',
            description: '',
            location: '',
            date: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '10:00',
            isAllDay: false,
            participantIds: []
        });
        onClose();
    };

    const handleCreateMeeting = async () => {
        if (!formData.title || !formData.date || formData.participantIds.length === 0 || !formData.description) {
            Alert.alert('Error', 'Please fill in title, description, date, and select at least one participant');
            return;
        }

        if (!formData.isAllDay && (!formData.startTime || !formData.endTime)) {
            Alert.alert('Error', 'Please set start and end times or mark as all-day');
            return;
        }

        setIsLoading(true);
        setStatusMessage("Creating your meeting...");
        setShowStatus(true);

        const requestBody = {
            title: formData.title,
            description: formData.description,
            location: formData.location || 'Online',
            date: formData.date,
            startTime: formData.isAllDay ? '09:00' : formData.startTime,
            endTime: formData.isAllDay ? '17:00' : formData.endTime,
            isAllDay: formData.isAllDay,
            participantIds: formData.participantIds
        };

        createMeetingMutation.mutate(requestBody, {
            onSuccess: (newMeeting) => {
                console.log('Meeting created successfully:', newMeeting);
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("Meeting created successfully!");
                
                setTimeout(() => {
                    setShowStatus(false);
                    handleCloseModal();
                }, 3000);
            },
            onError: () => {
                console.error('Error creating meeting');
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error creating meeting, please try again");
                setTimeout(() => {
                    setShowStatus(false);
                    handleCloseModal();
                }, 3000);
            }
        });
    };

    const handleParticipantsChange = (participantIds: number[]) => {
        updateFormData('participantIds', participantIds);
    };

    const handleTimeChange = (event: any, selectedTime: Date | undefined, type: 'start' | 'end') => {
        if (selectedTime) {
            const timeString = selectedTime.toTimeString().slice(0, 5); // HH:mm format
            updateFormData(type === 'start' ? 'startTime' : 'endTime', timeString);
        }
    };

    const createTimeDate = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return date;
    };

    const isToday = (date:string) => {
        const today = new Date();
        const selectedDate = new Date(date);
        
        return selectedDate.toDateString() === today.toDateString();
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
                    <Text style={styles.modalTitle}>Create New Meeting</Text>
                    <TouchableOpacity 
                        onPress={showStatus ? undefined : handleCreateMeeting} 
                        disabled={showStatus}
                    >
                        <Text style={[styles.saveButton, showStatus && styles.disabledText]}>Create</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    style={styles.modalContent} 
                    keyboardShouldPersistTaps="handled"
                >
                    
                    {/* Meeting Title */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Ionicons name="create-outline" size={20} color="#666" />
                            <Text style={styles.labelText}>Meeting Title</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={formData.title}
                            onChangeText={(value) => updateFormData('title', value)}
                            placeholder="Enter meeting title"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Meeting Description */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Ionicons name="document-text-outline" size={20} color="#666" />
                            <Text style={styles.labelText}>Description</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.description}
                            onChangeText={(value) => updateFormData('description', value)}
                            placeholder="Enter meeting description (optional)"
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Location */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Ionicons name="location-outline" size={20} color="#666" />
                            <Text style={styles.labelText}>Location</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={formData.location}
                            onChangeText={(value) => updateFormData('location', value)}
                            placeholder="Enter location (optional)"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Date */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Ionicons name="calendar-outline" size={20} color="#666" />
                            <Text style={styles.labelText}>Date</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.dateDisplay} 
                            onPress={() => setIsCalendarVisible(!isCalendarVisible)}
                        >
                            <Text style={styles.dateText}>
                                {new Date(formData.date).toLocaleDateString()}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color="#E9435E" />
                        </TouchableOpacity>
                        
                        {isCalendarVisible && (
                            <Calendar
                                current={formData.date}
                                markedDates={{
                                    [formData.date]: {
                                        selected: true, 
                                        selectedColor: '#E9435E'
                                    }
                                }}
                                onDayPress={day => {
                                    updateFormData('date', day.dateString);
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

                    {/* All Day Toggle */}
                    <View style={styles.inputGroup}>
                        <TouchableOpacity 
                            style={styles.checkboxRow}
                            onPress={() => updateFormData('isAllDay', !formData.isAllDay)}
                        >
                            <View style={[styles.checkbox, formData.isAllDay && styles.checkboxChecked]}>
                                {formData.isAllDay && <Ionicons name="checkmark" size={16} color="white" />}
                            </View>
                            <Text style={styles.checkboxLabel}>All Day Meeting</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Time Selection - Only show if not all day */}
                    {!formData.isAllDay && (
                        <View style={styles.timeRow}>
                            {/* Start Time */}
                            <View style={styles.timeGroup}>
                                <Text style={styles.labelText}>Start Time</Text>
                                <View
                                    style={styles.timeDisplay} 
                                >
                                    <DateTimePicker
                                        value={createTimeDate(formData.startTime)}
                                        minimumDate={
                                            isToday(formData.date) ? new Date() : undefined
                                        }
                                        style= {{marginLeft:-10}}
                                        mode="time"
                                        is24Hour={true}
                                        display="default"
                                        onChange={(event, time) => handleTimeChange(event, time, 'start')}
                                    />
                                    <Ionicons name="time-outline" size={20} color="#E9435E" />
                                </View>
                            </View>
                        
                            {/* End Time */}
                            <View style={styles.timeGroup}>
                                <Text style={styles.labelText}>End Time</Text>
                                <View
                                    style={styles.timeDisplay} 
                                >
                                    <DateTimePicker
                                        value={createTimeDate(formData.endTime)}
                                        style= {{marginLeft:-10}}
                                        mode="time"
                                        is24Hour={true}
                                        display="default"
                                        onChange={(event, time) => handleTimeChange(event, time, 'end')}
                                        minimumDate={createTimeDate(formData.startTime)}
                                    />
                                    <Ionicons name="time-outline" size={20} color="#E9435E" />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Participants Selection */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Participants</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.participantSelector}
                            onPress={() => setShowParticipantSelection(true)}
                        >
                            <View style={styles.participantInfo}>
                                <Ionicons name="people-outline" size={20} color="#666" />
                                <Text style={styles.participantText}>
                                    {formData.participantIds.length === 0 
                                        ? "Select participants" 
                                        : `${formData.participantIds.length} participant${formData.participantIds.length === 1 ? '' : 's'} selected`
                                    }
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                </ScrollView>

                {/* Participant Selection Screen */}
                <ParticipantSelectionScreen
                    visible={showParticipantSelection}
                    onClose={() => setShowParticipantSelection(false)}
                    selectedParticipantIds={formData.participantIds}
                    onParticipantsChange={handleParticipantsChange}
                    creatorId={user!.id}
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
        gap: 8,
        alignItems: "center",
        marginBottom: 8,
    },
    labelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    labelRequirement: {
        color: "red",
    
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
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#E9435E',
        borderColor: '#E9435E',
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
    },
    timeRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    timeGroup: {
        flex: 1,
    },
    timeDisplay: {
        marginTop:5,
        flexDirection: 'row',
        gap:10,
        alignItems: 'center',
    },
    timeText: {
        fontSize: 16,
        color: '#333',
    },
    participantSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#fff',
    },
    participantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    participantText: {
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

export default CreateMeetingModal;