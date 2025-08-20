import { useAuth } from '@/App';
import { useCommittees } from '@/src/hooks/useCommittees';
import { useLogInterview, useUpdateInterview } from '@/src/hooks/useInterviews';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import RNPickerSelect from 'react-native-picker-select';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusMessage } from '../../components/StatusMessage';
import { InterviewType } from '../../types/Interview';
const DetailsModal = ({visible, selectedInterview, onClose, POSITIONS, isReadOnly} : {selectedInterview: InterviewType | null, visible: boolean, onClose: () => void, POSITIONS: { label: string; value: string; }[], isReadOnly:boolean}) => {

    const [editData, setEditData] = useState<InterviewType | null>(null);
    const [isEditCalendarVisible, setIsEditCalendarVisible] = useState(false);
    const auth = useAuth()!;
   
    const { data: committees = [], isLoading: committeesLoading, error } = useCommittees();
    // Status message state
    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    const updateInterviewMutation = useUpdateInterview();
    const logInterviewMutation = useLogInterview();

    useEffect(() => {
        if (selectedInterview) {
            setEditData({ ...selectedInterview });
        }
    }, [selectedInterview]);

    if (!visible) return null;         
    if (!selectedInterview) return null;      
    if (!editData) return null;      

    const updateEditData = (field: string, value: any) => {
        setEditData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                [field]: value
            };
        });
    }

    const getSubcommittees = () => {
        if (!editData.committee.id) return [];
        const selectedCommittee = committees.find(c => c.id === editData.committee.id);
        return selectedCommittee?.subcommittees || [];
    };
    const handleUpdateInterview = async () => {
        if (!editData) return;
        if (!editData.name || !editData.gafEmail || !editData.position || !editData.committee || !editData.startTime || !editData.endTime) {
            console.log('Edit data is incomplete:', editData);
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        setStatusMessage("Updating your interview...");
        setShowStatus(true);

        const requestBody = {
            name: editData.name,
            gafEmail: editData.gafEmail,
            phoneNumber: editData.phoneNumber,
            gafId: editData.gafId,
            position: editData.position,
            committeeId: editData.committee.id,
            subCommitteeId: editData.subCommittee?.id || 0,
            startTime: editData.startTime,
            endTime: editData.endTime,
        };

        console.log('Updating interview with data:', requestBody);

        updateInterviewMutation.mutate({ interviewId: editData.id, data: requestBody }, {
            onSuccess: (updatedInterview) => {
                console.log('Interview updated successfully:', updatedInterview);
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("Interview updated successfully!");
                setTimeout(() => {
                    setShowStatus(false);
                    onClose();
                }, 3000);
            },
            onError: () => {
                console.error('Error updating interview');
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error updating interview, please try again");
                setTimeout(() => {
                    setShowStatus(false);
                    if (isSuccess) {
                        onClose();
                    }
                }, 3000);
            }
        });
    };

    const handleLogInterview = async () => {
        if (!editData) return;
        
        // Validate required logging fields
        if (!editData.performance || !editData.experience || !editData.communication || 
            !editData.teamwork || !editData.confidence || editData.accepted === undefined) {
            Alert.alert('Error', 'Please fill in all assessment fields');
            return;
        }

        // Validate rating ranges (1-10)
        const ratings = [editData.performance, editData.experience, editData.communication, 
                        editData.teamwork, editData.confidence];
        
        for (let rating of ratings) {
            if (rating < 1 || rating > 10) {
                Alert.alert('Error', 'All ratings must be between 1 and 10');
                return;
            }
        }

        setIsLoading(true);
        setStatusMessage("Logging interview results...");
        setShowStatus(true);

        const requestBody = {
            performance: editData.performance,
            experience: editData.experience,
            communication: editData.communication,
            teamwork: editData.teamwork,
            confidence: editData.confidence,
            accepted: editData.accepted,
            notes: editData.notes || ''
        };

        console.log('Logging interview with data:', requestBody);

        logInterviewMutation.mutate({ interviewId: editData.id, data: requestBody }, {
            onSuccess: (updatedInterview) => {
                console.log('Interview logged successfully:', updatedInterview);
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("Interview logged successfully!");
                setTimeout(() => {
                    setShowStatus(false);
                    onClose();
                }, 3000);
            },
            onError: () => {
                console.error('Error logging interview');
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error logging interview, please try again");
                setTimeout(() => {
                    setShowStatus(false);
                    if (isSuccess) {
                        onClose();
                    }
                }, 3000);
            }
        });
    };

    const handleJoinMeeting = async () => {
        const zoomUrl = selectedInterview.joinUrl; 
        if (!zoomUrl) {return;}
        
        try {
            //try to open Zoom app
            await Linking.openURL(zoomUrl);
        } catch (error) {
            console.error('Error opening Zoom:', error);
        }
    };
    

    const disabled = new Date(editData.endTime) < new Date() || editData.interviewerEmail!== auth?.user?.email;
    const logDisabled = editData.status === "LOGGED" || editData.interviewerEmail!== auth?.user?.email;
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={showStatus ? () => {} : onClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity  onPress={onClose} disabled={showStatus}>
                        <Ionicons name="close" size={24} color={showStatus ? "#ccc" : "#666"} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>
                        Interview Details
                    </Text>
                </View>

                <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Candidate Information</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Name</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={[styles.input, disabled && styles.pickerContainerDisabled]}
                            value={editData.name}
                            onChangeText={(value) => updateEditData('name', value)}
                            editable={new Date(editData.endTime) > new Date() && editData.interviewerEmail=== auth?.user?.email && !isReadOnly}
                            placeholder="Enter candidate's full name"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>GAF Email</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={[styles.input, disabled && styles.pickerContainerDisabled]}
                            value={editData.gafEmail}
                            onChangeText={(value) => updateEditData('gafEmail', value)}
                            editable={new Date(editData.endTime) > new Date() && editData.interviewerEmail=== auth?.user?.email && !isReadOnly}
                            placeholder="Enter GAF email"
                            placeholderTextColor="#999"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                  
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Phone Number</Text>
                        </View>
                        <TextInput
                            style={[styles.input, disabled && styles.pickerContainerDisabled]}
                            value={editData.phoneNumber}
                            onChangeText={(value) => updateEditData('phoneNumber', value)}
                            editable={new Date(editData.endTime) > new Date() && editData.interviewerEmail=== auth?.user?.email && !isReadOnly}
                            placeholder="Enter phone number"
                            placeholderTextColor="#999"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>GAF ID</Text>
                        </View>
                        <TextInput
                            style={[styles.input, disabled && styles.pickerContainerDisabled]}
                            value={editData.gafId}
                            onChangeText={(value) => updateEditData('gafId', value)}
                            editable={new Date(editData.endTime) > new Date() && editData.interviewerEmail=== auth?.user?.email && !isReadOnly}
                            placeholder="Enter GAF ID"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style = {styles.labelText}>Position</Text>
                                <Text style = {styles.labelRequirement}>*</Text>
                            </View>
                            <View style={[styles.pickerContainer, disabled && styles.pickerContainerDisabled]}>
                                <RNPickerSelect
                                    onValueChange={(value) => {
                                        updateEditData('position', value)
                                    }}
                                    items={POSITIONS}
                                    value={editData.position}
                                    disabled={new Date(editData.endTime) < new Date() || editData.interviewerEmail!= auth?.user?.email && !isReadOnly}
                                    placeholder={{ label: "Select position...", value: "" }}
                                    Icon={() => <Ionicons name="chevron-down" size={25} color="#666" />}
                                    style={pickerSelectStyles}
                                />
                            </View>
                    </View>

                    {/* Committee */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Committee</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <View style={[styles.pickerContainer, disabled && styles.pickerContainerDisabled]}>
                            <RNPickerSelect
                                onValueChange={(value) => {
                                    // Find the selected committee object
                                    const selectedCommittee = committees.find(c => c.id.toString() === value);
                                    updateEditData('committee', selectedCommittee || null);
                                    updateEditData('subCommittee', null); // Reset to null object
                                }}
                                items={committees.map(committee => ({
                                    label: committee.name,
                                    value: committee.id.toString()
                                }))}
                                value={editData.committee?.id?.toString() || ""} // Get ID from committee object
                                placeholder={{ label: committeesLoading ? "Loading committees..." : "Select committee...", value: "" }}
                                disabled={new Date(editData.endTime) < new Date() || editData.interviewerEmail != auth?.user?.email || isReadOnly || committeesLoading}
                                style={pickerSelectStyles}
                                Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
                            />
                        </View>
                    </View>
                    {/* Subcommittee */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Subcommittee</Text>
                        </View>
                        <View style={[
                            styles.pickerContainer, 
                            (disabled || !editData.committee || getSubcommittees().length === 0) && styles.pickerContainerDisabled
                        ]}>
                            <RNPickerSelect
                                onValueChange={(value) => {
                                    // Find the selected subcommittee object
                                    const selectedSubcommittee = getSubcommittees().find(s => s.id.toString() === value);
                                    updateEditData('subCommittee', selectedSubcommittee || null);
                                }}
                                items={getSubcommittees().map(subcommittee => ({
                                    label: subcommittee.name,
                                    value: subcommittee.id.toString()
                                }))}
                                value={editData.subCommittee?.id?.toString() || ""} // Get ID from subcommittee object
                                placeholder={{ 
                                    label: !editData.committee 
                                        ? "Select committee first..." 
                                        : getSubcommittees().length === 0 
                                            ? "No subcommittees available" 
                                            : "Select subcommittee...", 
                                    value: "" 
                                }}
                                disabled={new Date(editData.endTime) < new Date() || editData.interviewerEmail != auth?.user?.email || !editData.committee || getSubcommittees().length === 0 || isReadOnly || committeesLoading}
                                style={pickerSelectStyles}
                                Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
                            />
                        </View>
                    </View>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Interview Schedule</Text>
                    </View>
                   
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Date</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        
                        <TouchableOpacity 
                            style={[styles.dateDisplay, disabled && styles.pickerContainerDisabled]} 
                            onPress={(new Date(editData.endTime) < new Date() || editData.interviewerEmail!= auth?.user?.email || isReadOnly) ? () =>{} : () => setIsEditCalendarVisible(!isEditCalendarVisible)}
                        >
                            <Text style={styles.dateText}>
                                {new Date(editData.startTime).toLocaleDateString()}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color="#E9435E" />
                        </TouchableOpacity>
                                
                        {isEditCalendarVisible && (
                            <Calendar
                                current={editData.startTime.split('T')[0]}
                                markedDates={{
                                    [editData.startTime.split('T')[0]]: {
                                        selected: true, 
                                        selectedColor: '#E9435E'
                                    }
                                }}
                                onDayPress={day => {
                                    // Update both start and end time with new date
                                    const currentStartTime = new Date(editData.startTime);
                                    const currentEndTime = new Date(editData.endTime);
                                    
                                    const newStartTime = new Date(day.dateString + 'T' + currentStartTime.toTimeString().split(' ')[0]);
                                    const newEndTime = new Date(day.dateString + 'T' + currentEndTime.toTimeString().split(' ')[0]);
                                    
                                    updateEditData('startTime', newStartTime);
                                    updateEditData('endTime', newEndTime);
                                    setIsEditCalendarVisible(false);
                                }}
                                minDate={new Date().toISOString().split('T')[0]}
                                style={{
                                    borderWidth: 2,
                                    borderColor: '#E9435E',
                                    borderRadius:5,
                                    marginTop:20
                                }}
                                theme={{
                                    backgroundColor: '#ffffff',
                                    calendarBackground: '#ffffff',
                                    textSectionTitleColor: '#b6c1cd',
                                    selectedDayBackgroundColor: '#E9435E',
                                    selectedDayTextColor: '#ffffff',
                                    dayTextColor: '#2d4150',
                                    todayTextColor:"#E9435E",
                                    textDisabledColor: '#999',
                                    arrowColor:"#E9435E",
                                }}
                            />
                        )}
                    </View>
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Time</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        
                       <View style={[styles.timeRow]}>
                            <View style={styles.timeSelector}>
                                {(new Date(editData.endTime) > new Date() && editData.interviewerEmail === auth?.user?.email && !isReadOnly) ? (
                                    <DateTimePicker
                                        value={new Date(editData?.startTime)}
                                        mode="time"
                                        display="default"
                                        style={{ marginLeft: -10 }}
                                        onChange={(event, time) => {
                                            if (time) {
                                                const currentDate = editData.startTime.split('T')[0]; 
                                                const timeString = time.toTimeString().split(' ')[0]; 
                                                const newDateTime = `${currentDate}T${timeString}`;
                                                updateEditData('startTime', newDateTime); 
                                            }
                                        }}
                                    />
                                ) : (
                                    <Text style={styles.disabledTimeText}>
                                        {new Date(editData.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </Text>
                                )}
                                <Ionicons name="time-outline" size={18} color="#666" />
                            </View>
                            <View style={styles.timeSeparator}>
                                <Text style={styles.separatorText}>to</Text>
                            </View>
                            <View style={styles.timeSelector}>
                                {(new Date(editData.endTime) > new Date() && editData.interviewerEmail === auth?.user?.email && !isReadOnly) ? (
                                    <DateTimePicker
                                        value={new Date(editData?.endTime)}
                                        mode="time"
                                        display="default"
                                        style={{ marginLeft: -10 }}
                                        onChange={(event, time) => {
                                            if (time) {
                                                const currentDate = editData?.endTime?.split('T')[0];
                                                const timeString = time.toTimeString().split(' ')[0];
                                                const newDateTime = `${currentDate}T${timeString}`;
                                                updateEditData('endTime', newDateTime);
                                            }
                                        }}
                                        minimumDate={new Date(editData.startTime)}
                                    />
                                ) : (
                                    <Text style={styles.disabledTimeText}>
                                        {new Date(editData.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </Text>
                                )}
                                <Ionicons name="time-outline" size={18} color="#666" />
                            </View>
                        </View>
                    </View>

                    {selectedInterview.joinUrl && (
                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Zoom Meeting</Text>
                            </View>
                            <TouchableOpacity style={styles.teamsLinkButton} onPress={handleJoinMeeting}>
                                <Ionicons name="videocam-outline" size={20} color="#0078d4" />
                                <Text style={styles.teamsLinkText}>Join Zoom Meeting</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Interviewer Information</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Interviewer</Text>
                        </View>
                        <View style={styles.interviewerInfo}>
                            <Text style={styles.interviewerName}>{selectedInterview.interviewerName}</Text>
                            <Text style={styles.interviewerEmail}>{selectedInterview.interviewerEmail}</Text>
                        </View>
                    </View>

                    {(selectedInterview.supervisorName && selectedInterview.supervisorEmail) && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Supervisor Information</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.label}>
                                    <Text style={styles.labelText}>Supervisor</Text>
                                </View>
                                <View style={styles.interviewerInfo}>
                                    <Text style={styles.interviewerName}>{selectedInterview.supervisorName}</Text>
                                    <Text style={styles.interviewerEmail}>{selectedInterview.supervisorEmail}</Text>
                                </View>
                            </View>
                        </>
                    )}
            
                    {(selectedInterview.status === 'LOGGED' || new Date(editData.endTime) < new Date()) && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Interview Assessment</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.label}>
                                    <Text style={styles.labelText}>Performance (1-10)</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, logDisabled && styles.pickerContainerDisabled]}
                                    value={editData.performance?.toString() || ''}
                                    onChangeText={(value) => updateEditData('performance', value ? parseInt(value) : undefined)}
                                    editable={editData.status !== 'LOGGED' && editData.interviewerEmail=== auth?.user?.email}
                                    placeholder="Rate performance 1-10"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.label}>
                                    <Text style={styles.labelText}>Experience (1-10)</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, logDisabled && styles.pickerContainerDisabled]}
                                    value={editData.experience?.toString() || ''}
                                    onChangeText={(value) => updateEditData('experience', value ? parseInt(value) : undefined)}
                                    editable={editData.status !== 'LOGGED' && editData.interviewerEmail=== auth?.user?.email}
                                    placeholder="Rate experience 1-10"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.label}>
                                    <Text style={styles.labelText}>Communication (1-10)</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, logDisabled && styles.pickerContainerDisabled]}
                                    value={editData.communication?.toString() || ''}
                                    onChangeText={(value) => updateEditData('communication', value ? parseInt(value) : undefined)}
                                    editable={editData.status !== 'LOGGED' && editData.interviewerEmail=== auth?.user?.email}
                                    placeholder="Rate communication 1-10"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.label}>
                                    <Text style={styles.labelText}>Teamwork (1-10)</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, logDisabled && styles.pickerContainerDisabled]}
                                    value={editData.teamwork?.toString() || ''}
                                    onChangeText={(value) => updateEditData('teamwork', value ? parseInt(value) : undefined)}
                                    editable={editData.status !== 'LOGGED' && editData.interviewerEmail=== auth?.user?.email}
                                    placeholder="Rate teamwork 1-10"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.label}>
                                    <Text style={styles.labelText}>Confidence (1-10)</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, logDisabled && styles.pickerContainerDisabled]}
                                    value={editData.confidence?.toString() || ''}
                                    onChangeText={(value) => updateEditData('confidence', value ? parseInt(value) : undefined)}
                                    editable={editData.status !== 'LOGGED' && editData.interviewerEmail=== auth?.user?.email}
                                    placeholder="Rate confidence 1-10"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.label}>
                                    <Text style={styles.labelText}>Interview Notes</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, styles.textArea, logDisabled && styles.pickerContainerDisabled]}
                                    value={editData!.notes || ''}
                                    onChangeText={(value) => updateEditData('notes', value)}
                                    editable={editData.status !== 'LOGGED' && editData.interviewerEmail=== auth?.user?.email}
                                    placeholder="Add any additional notes about the interview..."
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.label}>
                                    <Text style={styles.labelText}>Outcome</Text>
                                </View>
                                <View style={styles.radioGroup}>
                                    <TouchableOpacity 
                                        style={styles.radioOption}
                                        onPress={() => updateEditData('accepted', true)}
                                        disabled={editData.status === 'LOGGED' || editData.interviewerEmail !== auth?.user?.email}
                                    >
                                        {editData.accepted ? (
                                            <Ionicons name="radio-button-on" size={24} color={logDisabled ? "#999" : "#E9435E"}/>
                                        ): (
                                            <Ionicons name="radio-button-off" size={24} color={logDisabled ? "#999" : "#E9435E"}/>
                                        )}
                                        <Text style={styles.radioText}>Accepted</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={styles.radioOption}
                                        onPress={() => updateEditData('accepted', false)}
                                        disabled={editData.status === 'LOGGED' || editData.interviewerEmail !== auth?.user?.email}
                                    >
                                        {!editData.accepted ? (
                                            <Ionicons name="radio-button-on" size={24} color={logDisabled ? "#999" : "#E9435E"}/>
                                        ): (
                                            <Ionicons name="radio-button-off" size={24} color={logDisabled ? "#999" : "#E9435E"}/>
                                        )}
                                        <Text style={styles.radioText}>Rejected</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                    

                    {editData.interviewerEmail === auth?.user?.email && (
                        <>
                            {selectedInterview?.status === "LOGGED" ? (
                                null
                            ) : new Date(selectedInterview!.startTime) < new Date() ? (
                                <TouchableOpacity 
                                    style={styles.logButton}
                                    onPress={handleLogInterview}
                                    disabled={showStatus}
                                >
                                    <Text style={styles.logText}>Log</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity 
                                    style={styles.logButton}
                                    onPress={handleUpdateInterview}
                                    disabled={showStatus}
                                >
                                    <Text style={styles.logText}>Save</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                    
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
    )
}

const styles = StyleSheet.create({
     modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        gap:30,
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionHeader: {
        marginTop: 20,
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
     inputGroup: {
        marginBottom: 20,
    },
    label: {
        flexDirection:"row",
        gap:5,
        alignItems:"center"
    },
    labelRequirement:{
        color:"red",
        fontSize:16
    },
    labelText:{
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
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    pickerContainerDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#ccc',
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
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20
    },
    timeSelector: {
        flexDirection: 'row',
        gap: 10,
        alignItems:"center",
    },
    timeSeparator: {
        justifyContent:"center"
    },
    separatorText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    teamsLinkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0078d4',
        gap: 8,
    },
    teamsLinkText: {
        fontSize: 16,
        color: '#0078d4',
        fontWeight: '500',
    },
    interviewerInfo: {
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    interviewerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    interviewerEmail: {
        fontSize: 14,
        color: '#666',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
    },
    logButton: {
        width: '100%',
        backgroundColor: '#E9435E',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
    },
    logText:{
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
    radioGroup: {
        flexDirection: 'row',
        gap: 20,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    radioText: {
        fontSize: 16,
        color: '#333',
    },
    disabledTimeText: {
        fontSize: 16,
        color: '#999',
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        textAlign: 'center',
        minWidth: 80,
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
        right: 10,
        top:10
    }
};

export default DetailsModal;