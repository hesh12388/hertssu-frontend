import { useAuth } from '@/App';
import { useCreateEvaluation, useMeetingEvaluations, useUpdateEvaluation } from '@/src/hooks/useMeetingEvaluations';
import { useDeleteMeeting, useUpdateMeeting } from '@/src/hooks/useMeetings';
import { useUsers } from '@/src/hooks/useUsers';
import { MeetingType, formatMeetingTime, getFullName, isMeetingUpcoming } from '@/src/types/meeting';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { StatusMessage } from '../../components/StatusMessage';
import ParticipantSelectionScreen from './ParticipantSelection';

interface MeetingDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    selectedMeeting: MeetingType | null;
}

interface EvaluationFormData {
    performance: number;
    attended: boolean;
    late: boolean;
    hasException: boolean;
    note: string;
}

const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({
    visible,
    onClose,
    selectedMeeting
}) => {
    const { user } = useAuth()!;
    const [activeTab, setActiveTab] = useState<'info' | 'performance'>('info');
    const [isEditing, setIsEditing] = useState(false);
    const [evaluationForms, setEvaluationForms] = useState<{ [participantId: number]: EvaluationFormData }>({});
    const [showParticipantSelection, setShowParticipantSelection] = useState(false);
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    
    
    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    // Edit form data
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        location: '',
        date: '',
        startTime: '',
        endTime: '',
        isAllDay: false,
        participantIds: [] as number[]
    });

    const updateMeetingMutation = useUpdateMeeting();
    const deleteMeetingMutation = useDeleteMeeting();
    const createEvaluationMutation = useCreateEvaluation();
    const updateEvaluationMutation = useUpdateEvaluation();

    // Fetch evaluations for the meeting
    const { data: evaluations = [], isLoading: evaluationsLoading, error: evaluationsError, refetch: refetchEvaluations, isFetching } = useMeetingEvaluations(selectedMeeting?.meetingId);
    const { data: users = [] } = useUsers();
    const isUpcoming = selectedMeeting ? isMeetingUpcoming(selectedMeeting.date, selectedMeeting.startTime) : false;
    const canEdit = isUpcoming && selectedMeeting?.createdBy.userId === user?.id;
    const canDelete = isUpcoming && selectedMeeting?.createdBy.userId === user?.id;

    
    // Initialize edit form when meeting changes
    useEffect(() => {
        if (selectedMeeting) {
            setEditFormData({
                title: selectedMeeting.title,
                description: selectedMeeting.description,
                location: selectedMeeting.location,
                date: selectedMeeting.date,
                startTime: selectedMeeting.startTime,
                endTime: selectedMeeting.endTime,
                isAllDay: selectedMeeting.isAllDay,
                participantIds: selectedMeeting.participants.map(p => p.userId)
            });

            const forms: { [participantId: number]: EvaluationFormData } = {};
            selectedMeeting.participants.forEach(participant => {
                const existingEvaluation = evaluations.find(evaluation => evaluation.user.userId === participant.userId);
                forms[participant.userId] = existingEvaluation ? {
                    performance: existingEvaluation.performance,
                    attended: existingEvaluation.attended,
                    late: existingEvaluation.late,
                    hasException: existingEvaluation.hasException,
                    note: existingEvaluation.note || ''
                } : {
                    performance: 1,
                    attended: true,
                    late: false,
                    hasException: false,
                    note: ''
                };
            });
            setEvaluationForms(forms);
        }
    }, [selectedMeeting, activeTab]);

    const handleClose = () => {
        setActiveTab('info');
        setIsEditing(false);
        onClose();
    };

    const handleSaveChanges = async () => {
        if (!selectedMeeting) return;

        setIsLoading(true);
        setStatusMessage("Updating meeting...");
        setShowStatus(true);

        updateMeetingMutation.mutate({
            meetingId: selectedMeeting.meetingId,
            data: {
                title: editFormData.title,
                description: editFormData.description,
                location: editFormData.location,
                date: editFormData.date,
                startTime: editFormData.isAllDay ? '09:00' : editFormData.startTime,
                endTime: editFormData.isAllDay ? '17:00' : editFormData.endTime,
                isAllDay: editFormData.isAllDay,
                participantIds: editFormData.participantIds.filter(id => id !== selectedMeeting.createdBy.userId)
            }
        }, {
            onSuccess: () => {
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("Meeting updated successfully!");
                setIsEditing(false);
                setTimeout(() => setShowStatus(false), 2500);
                onClose();
            },
            onError: () => {
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error updating meeting!");
                setTimeout(() => setShowStatus(false), 2500);
            }
        });
    };

    const handleDeleteMeeting = () => {
        if (!selectedMeeting) return;

        Alert.alert(
            "Delete Meeting",
            `Are you sure you want to delete "${selectedMeeting.title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        setIsLoading(true);
                        setStatusMessage("Deleting meeting...");
                        setShowStatus(true);

                        deleteMeetingMutation.mutate({ meetingId: selectedMeeting.meetingId }, {
                            onSuccess: () => {
                                setIsLoading(false);
                                setIsSuccess(true);
                                setResultMessage("Meeting deleted successfully!");
                                setTimeout(() => {
                                    setShowStatus(false);
                                    handleClose();
                                }, 2500);
                            },
                            onError: () => {
                                setIsLoading(false);
                                setIsSuccess(false);
                                setResultMessage("Error deleting meeting!");
                                setTimeout(() => setShowStatus(false), 2500);
                            }
                        });
                    }
                }
            ]
        );
    };

    const handleSaveEvaluation = (participantId: number) => {
        if (!selectedMeeting) return;

        const formData = evaluationForms[participantId];
        const existingEvaluation = evaluations.find(evaluation => evaluation.user.userId === participantId);

        setIsLoading(true);
        setStatusMessage("Saving evaluation...");
        setShowStatus(true);

        if (existingEvaluation) {
            // Update existing evaluation
            updateEvaluationMutation.mutate({
                evaluationId: existingEvaluation.evaluationId,
                meetingId: selectedMeeting.meetingId,
                data: {
                    performance: formData.performance,
                    attended: formData.attended,
                    late: formData.late,
                    hasException: formData.hasException,
                    note: formData.note
                }
            }, {
                onSuccess: () => {
                    setIsLoading(false);
                    setIsSuccess(true);
                    setResultMessage("Evaluation saved successfully!");
                    setTimeout(() => setShowStatus(false), 2500);
                },
                onError: () => {
                    setIsLoading(false);
                    setIsSuccess(false);
                    setResultMessage("Error saving evaluation!");
                    setTimeout(() => setShowStatus(false), 2500);
                }
            });
        } else {
            // Create new evaluation
            createEvaluationMutation.mutate({
                meetingId: selectedMeeting.meetingId,
                userId: participantId,
                performance: formData.performance,
                attended: formData.attended,
                late: formData.late,
                hasException: formData.hasException,
                note: formData.note
            }, {
                onSuccess: () => {
                    setIsLoading(false);
                    setIsSuccess(true);
                    setResultMessage("Evaluation saved successfully!");
                    setTimeout(() => setShowStatus(false), 2500);
                },
                onError: () => {
                    setIsLoading(false);
                    setIsSuccess(false);
                    setResultMessage("Error saving evaluation!");
                    setTimeout(() => setShowStatus(false), 2500);
                }
            });
        }
    };

    const handleClearEvaluation = (participantId: number) => {
        setEvaluationForms(prev => ({
            ...prev,
            [participantId]: {
                performance: 1,
                attended: true,
                late: false,
                hasException: false,
                note: ''
            }
        }));
    };

    const updateEvaluationForm = (participantId: number, field: keyof EvaluationFormData, value: any) => {
        setEvaluationForms(prev => ({
            ...prev,
            [participantId]: {
                ...prev[participantId],
                [field]: value
            }
        }));
    };

    const renderStarRating = (participantId: number, currentRating: number) => {
        return (
            <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => updateEvaluationForm(participantId, 'performance', star)}
                    >
                        <Ionicons
                            name={star <= currentRating ? "star" : "star-outline"}
                            size={24}
                            color={star <= currentRating ? "#FFD700" : "#DDD"}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const handleTimeChange = (event: any, selectedTime: Date | undefined, type: 'start' | 'end') => {
        if (selectedTime) {
            const timeString = selectedTime.toTimeString().slice(0, 5); // HH:mm format
            if(type === 'start'){
                setEditFormData(prev => ({ ...prev, startTime: timeString }))
            }
            else{
                setEditFormData(prev => ({ ...prev, endTime: timeString }))
            }
            
        }
    };

    const createTimeDate = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return date;
    };

    if (!selectedMeeting) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose}>
                        <View style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.title}>Meeting Details</Text>
                    {canEdit ? (
                        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                            <View style={styles.editButton}>
                                <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
                            </View>
                        </TouchableOpacity>
                    ):(
                        <TouchableOpacity onPress={() => setActiveTab('performance')}>
                            <View style={styles.editButton}>
                                <Text style={styles.editButtonText}>Log</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'info' && styles.activeTab]}
                        onPress={() => setActiveTab('info')}
                    >
                        <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>Info</Text>
                    </TouchableOpacity>
                    {!isUpcoming && (
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'performance' && styles.activeTab]}
                            onPress={() => setActiveTab('performance')}
                        >
                            <Text style={[styles.tabText, activeTab === 'performance' && styles.activeTabText]}>Performance</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView style={styles.content} 
                    refreshControl={
                        <RefreshControl 
                            refreshing={isFetching} 
                            onRefresh={activeTab === "performance" ? () => {refetchEvaluations} : ()=>{}}
                            tintColor="#E9435E"
                            colors={["#E9435E"]}
                        />
                    }
                >
                    {activeTab === 'info' ? (
                        <View style={styles.infoTab}>
                            {/* Meeting Title */}
                            <View style={styles.infoRow}>
                                <Ionicons name="create-outline" size={20} color="#666" />
                                {isEditing ? (
                                    <TextInput
                                        style={styles.editInput}
                                        value={editFormData.title}
                                        onChangeText={(text) => setEditFormData(prev => ({ ...prev, title: text }))}
                                        placeholder="Meeting title"
                                    />
                                ) : (
                                    <Text style={styles.infoText}>{selectedMeeting.title}</Text>
                                )}
                            </View>

                            {/* Location */}
                            <View style={styles.infoRow}>
                                <Ionicons name="location-outline" size={20} color="#666" />
                                {isEditing ? (
                                    <TextInput
                                        style={styles.editInput}
                                        value={editFormData.location}
                                        onChangeText={(text) => setEditFormData(prev => ({ ...prev, location: text }))}
                                        placeholder="Location"
                                    />
                                ) : (
                                    <Text style={styles.infoText}>{selectedMeeting.location || 'No location'}</Text>
                                )}
                            </View>

                            {/* Participants */}
                            <View style={styles.participantsSection}>
                                <View style={styles.participantsHeader}>
                                    <Ionicons name="people-outline" size={20} color="#666" />
                                    <Text style={styles.participantsTitle}>
                                        Participants ({isEditing ? editFormData.participantIds.length : selectedMeeting.participants.length})
                                    </Text>
                                    {isEditing && (
                                        <TouchableOpacity 
                                            style={styles.editParticipantsButton}
                                            onPress={() => setShowParticipantSelection(true)}
                                        >
                                            <Text style={styles.editParticipantsText}>Edit</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                
                                {isEditing ? (
                                    // Show participants from edit form
                                    editFormData.participantIds.map((participantId) => {
                                        const participant = users.find(u => u.id === participantId);
                                        if (!participant) return null;
                                        
                                        return (
                                            <View key={participant.id} style={styles.participantItem}>
                                                <View style={styles.participantAvatar}>
                                                    <Text style={styles.avatarText}>
                                                        {participant.firstName.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View style={styles.participantInfo}>
                                                    <Text style={styles.participantName}>{participant.firstName} {participant.lastName}</Text>
                                                    <Text style={styles.participantEmail}>{participant.email}</Text>
                                                </View>
                                            </View>
                                        );
                                    })
                                ) : (
                                    // Show original meeting participants
                                    selectedMeeting.participants.map((participant) => (
                                        <View key={participant.userId} style={styles.participantItem}>
                                            <View style={styles.participantAvatar}>
                                                <Text style={styles.avatarText}>
                                                    {participant.firstName.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={styles.participantInfo}>
                                                <Text style={styles.participantName}>{getFullName(participant)}</Text>
                                                <Text style={styles.participantEmail}>{participant.email}</Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>

                            {/* Description */}
                            <View style={styles.infoRow}>
                                <Ionicons name="document-text-outline" size={20} color="#666" />
                                {isEditing ? (
                                    <TextInput
                                        style={[styles.editInput, styles.editTextArea]}
                                        value={editFormData.description}
                                        onChangeText={(text) => setEditFormData(prev => ({ ...prev, description: text }))}
                                        placeholder="Description"
                                        multiline
                                        numberOfLines={3}
                                    />
                                ) : (
                                    <Text style={styles.infoText}>{selectedMeeting.description || 'No description'}</Text>
                                )}
                            </View>

                            {/* Date */}
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar-outline" size={20} color="#666" />
                                {isEditing ? (
                                    <View style={styles.dateTimeContainer}>
                                        <TouchableOpacity 
                                            style={styles.dateDisplay} 
                                            onPress={() => setIsCalendarVisible(!isCalendarVisible)}
                                        >
                                            <Text style={styles.dateText}>
                                                {new Date(editFormData.date).toLocaleDateString()}
                                            </Text>
                                            <Ionicons name="calendar-outline" size={20} color="#E9435E" />
                                        </TouchableOpacity>
                                        
                                        {isCalendarVisible && (
                                            <Calendar
                                                current={editFormData.date}
                                                markedDates={{
                                                    [editFormData.date]: {
                                                        selected: true, 
                                                        selectedColor: '#E9435E'
                                                    }
                                                }}
                                                onDayPress={day => {
                                                    setEditFormData(prev => ({ ...prev, date: day.dateString }));
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
                                ) : (
                                    <Text style={styles.infoText}>{new Date(selectedMeeting.date).toLocaleDateString()}</Text>
                                )}
                            </View>

                            {/* All Day Toggle - only when editing */}
                            {isEditing && (
                                <View style={styles.infoRow}>
                                    <TouchableOpacity 
                                        style={styles.checkboxRow}
                                        onPress={() => setEditFormData(prev => ({ ...prev, isAllDay: !prev.isAllDay }))}
                                    >
                                        <View style={[styles.checkbox, editFormData.isAllDay && styles.checkboxChecked]}>
                                            {editFormData.isAllDay && <Ionicons name="checkmark" size={16} color="white" />}
                                        </View>
                                        <Text style={styles.checkboxLabel}>All Day Meeting</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Time Selection */}
                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={20} color="#666" />
                                {isEditing && !editFormData.isAllDay ? (
                                    <View style={styles.timeEditContainer}>
                                        {/* Start Time */}
                                        <View style={styles.timeGroup}>
                                            <Text style={styles.timeLabel}>Start Time</Text>
                                            <View style={styles.timeDisplay}>
                                                <DateTimePicker
                                                    value={createTimeDate(editFormData.startTime)}
                                                    style={{marginLeft: -10}}
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
                                            <Text style={styles.timeLabel}>End Time</Text>
                                            <View style={styles.timeDisplay}>
                                                <DateTimePicker
                                                    value={createTimeDate(editFormData.endTime)}
                                                    style={{marginLeft: -10}}
                                                    mode="time"
                                                    is24Hour={true}
                                                    display="default"
                                                    onChange={(event, time) => handleTimeChange(event, time, 'end')}
                                                    minimumDate={createTimeDate(editFormData.startTime)}
                                                />
                                                <Ionicons name="time-outline" size={20} color="#E9435E" />
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <Text style={styles.infoText}>
                                        {formatMeetingTime(selectedMeeting.startTime, selectedMeeting.endTime, selectedMeeting.isAllDay)}
                                    </Text>
                                )}
                            </View>

                            {/* Timestamps */}
                            <View style={styles.infoRow}>
                                <Ionicons name="information-circle-outline" size={20} color="#666" />
                                <Text style={styles.infoText}>Created: {selectedMeeting.createdAt}</Text>
                            </View>

                            {/* Save Changes Button */}
                            {isEditing && (
                                <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </TouchableOpacity>
                            )}

                            {/* Delete Button */}
                            {canDelete && !isEditing && (
                                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteMeeting}>
                                    <Text style={styles.deleteButtonText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.performanceTab}>
                            {selectedMeeting.participants.map((participant) => {
                                const formData = evaluationForms[participant.userId];
                                if (!formData) return null;

                                return (
                                    <View key={participant.userId} style={styles.evaluationCard}>
                                        {/* Participant Info */}
                                        <View style={styles.participantHeader}>
                                            <View style={styles.participantAvatar}>
                                                <Text style={styles.avatarText}>
                                                    {participant.firstName.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={styles.participantInfo}>
                                                <Text style={styles.participantName}>{getFullName(participant)}</Text>
                                                <Text style={styles.participantEmail}>{participant.email}</Text>
                                            </View>
                                        </View>

                                        {/* Performance Rating */}
                                        <View style={styles.ratingSection}>
                                            <Text style={styles.ratingLabel}>Performance 1-5</Text>
                                            {renderStarRating(participant.userId, formData.performance)}
                                        </View>

                                        {/* Toggles */}
                                        <View style={styles.toggleSection}>
                                            <View style={styles.toggleRow}>
                                                <Text style={styles.toggleLabel}>Attended</Text>
                                                <Switch
                                                    value={formData.attended}
                                                    onValueChange={(value) => updateEvaluationForm(participant.userId, 'attended', value)}
                                                    trackColor={{ false: '#D1D5DB', true: '#E9435E' }}
                                                    thumbColor={formData.attended ? '#FFFFFF' : '#FFFFFF'}
                                                />
                                            </View>

                                            <View style={styles.toggleRow}>
                                                <Text style={styles.toggleLabel}>Late</Text>
                                                <Switch
                                                    value={formData.late}
                                                    onValueChange={(value) => updateEvaluationForm(participant.userId, 'late', value)}
                                                    trackColor={{ false: '#D1D5DB', true: '#E9435E' }}
                                                    thumbColor={formData.late ? '#FFFFFF' : '#FFFFFF'}
                                                />
                                            </View>

                                            <View style={styles.toggleRow}>
                                                <Text style={styles.toggleLabel}>Has Exception</Text>
                                                <Switch
                                                    value={formData.hasException}
                                                    onValueChange={(value) => updateEvaluationForm(participant.userId, 'hasException', value)}
                                                    trackColor={{ false: '#D1D5DB', true: '#E9435E' }}
                                                    thumbColor={formData.hasException ? '#FFFFFF' : '#FFFFFF'}
                                                />
                                            </View>
                                        </View>

                                        {/* Note */}
                                        <View style={styles.noteSection}>
                                            <Text style={styles.noteLabel}>Note</Text>
                                            <TextInput
                                                style={styles.noteInput}
                                                value={formData.note}
                                                onChangeText={(text) => updateEvaluationForm(participant.userId, 'note', text)}
                                                placeholder="Enter a note"
                                                placeholderTextColor={"#999"}
                                                multiline
                                                numberOfLines={4}
                                            />
                                        </View>

                                        {/* Action Buttons */}
                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity
                                                style={styles.saveEvaluationButton}
                                                onPress={() => handleSaveEvaluation(participant.userId)}
                                            >
                                                <Text style={styles.saveEvaluationButtonText}>Save</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.clearButton}
                                                onPress={() => handleClearEvaluation(participant.userId)}
                                            >
                                                <Text style={styles.clearButtonText}>Clear</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
                

                {isEditing && (
                    <ParticipantSelectionScreen
                        visible={showParticipantSelection}
                        onClose={() => setShowParticipantSelection(false)}
                        selectedParticipantIds={editFormData.participantIds}
                        onParticipantsChange={(participantIds) => 
                            setEditFormData(prev => ({ ...prev, participantIds }))
                        }
                        creatorId={selectedMeeting.createdBy.userId}
                    />
                )}
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

                {evaluationsLoading && (
                    <View style={styles.statusOverlay}>
                        <StatusMessage 
                            isLoading={true}
                            isSuccess={false}
                            loadingMessage={"Getting evaluations..."}
                            resultMessage={""}
                        />
                    </View>
                )}
            
                 {evaluationsError && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Error loading evaluations. Please try again later.</Text>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
    dateTimeContainer: {
        flex: 1,
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
        flex: 1,
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
    timeEditContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: 16,
    },
    timeGroup: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    timeDisplay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    editParticipantsButton: {
        backgroundColor: '#E9435E',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    editParticipantsText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    closeButton: {
        backgroundColor: '#E9435E',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    editButton: {
        backgroundColor: '#E9435E',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    editButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#E9435E',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#E9435E',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    infoTab: {
        gap: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    editInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    editTextArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    participantsSection: {
        gap: 12,
    },
    participantsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    participantsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    participantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingLeft: 32,
    },
    participantHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    participantAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E9435E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    participantInfo: {
        flex: 1,
    },
    participantName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    participantEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    saveButton: {
        backgroundColor: '#E9435E',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#E9435E',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    performanceTab: {
        gap: 24,
    },
    evaluationCard: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        gap: 16,
    },
    ratingSection: {
        gap: 8,
    },
    ratingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    starContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    toggleSection: {
        gap: 12,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleLabel: {
        fontSize: 16,
        color: '#333',
    },
    noteSection: {
        gap: 8,
    },
    noteLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    noteInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    saveEvaluationButton: {
        flex: 1,
        backgroundColor: '#22C55E',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveEvaluationButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    clearButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
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

export default MeetingDetailsModal;