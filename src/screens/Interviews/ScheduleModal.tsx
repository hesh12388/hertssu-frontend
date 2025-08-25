import { useCommittees } from '@/src/hooks/useCommittees';
import { useCreateInterview } from '@/src/hooks/useInterviews';
import { useUsers } from '@/src/hooks/useUsers';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import RNPickerSelect from 'react-native-picker-select';
import { StatusMessage } from '../../components/StatusMessage';
const ScheduleModal = ({POSITIONS, onClose, visible}: {POSITIONS: { label: string; value: string; }[], onClose: () => void, visible: boolean}) => {
  
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [formData, setFormData] = useState({
            name: '',
            gafEmail: '',
            phoneNumber:'',
            gafId: '',
            position: '',
            committeeId: '',
            subcommitteeId: '',
            date: new Date().toISOString().split('T')[0],
            startTime: new Date(),
            endTime: new Date(),
            supervisorId: ''
        });
    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [resultMessage, setResultMessage] = useState("");
    const createInterviewMutation = useCreateInterview();
    const { data: committees = [], isLoading: committeesLoading, error } = useCommittees();
    const { data: users = [], isLoading: usersLoading, error: errorUsers } = useUsers();
    const [supervisorSearch, setSupervisorSearch] = useState('');
    const [showSupervisorDropdown, setShowSupervisorDropdown] = useState(false);

    const getSubcommittees = () => {
        if (!formData.committeeId) return [];
        const selectedCommittee = committees.find(c => c.id.toString() === formData.committeeId);
        return selectedCommittee?.subcommittees || [];
    };
    const getFilteredSupervisors = () => {
        if (!supervisorSearch.trim()) return users;
        
        return users.filter(user => 
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
            user.email.toLowerCase().includes(supervisorSearch.toLowerCase())
        );
    };

    const getSelectedSupervisor = () => {
        if (!formData.supervisorId) return null;
        return users.find(user => user.id.toString() === formData.supervisorId);
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
            name: '',
            gafEmail: '',
            phoneNumber:'',
            gafId: '',
            position: '',
            committeeId: '',
            subcommitteeId: '',
            date:new Date().toISOString().split('T')[0],
            startTime: new Date(),
            endTime: new Date(),
            supervisorId: ''
        });
        setSupervisorSearch('');
        setShowSupervisorDropdown(false);
        onClose();
    };

    const convertTo24Hour = (time12h: string) => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        
        if (hours === '12') {
            hours = '00';
        }
        
        if (modifier === 'PM') {
            hours = (parseInt(hours, 10) + 12).toString();
        }
        
        return `${hours.padStart(2, '0')}:${minutes}`;
    };


    const handleScheduleInterview = async () => {
        if (!formData.name || !formData.gafEmail || !formData.position || !formData.committeeId || !formData.date || !formData.startTime || !formData.endTime || !formData.supervisorId) {
            console.log('Form data is incomplete:', formData);
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        setStatusMessage("Scheduling your interview...");
        setShowStatus(true);

        // Convert date and times to LocalDateTime format
        const dateStr = formData.date;
        const startTimeStr = convertTo24Hour(formData.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        const endTimeStr = convertTo24Hour(formData.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        
        // Combine date and time for LocalDateTime format
        const startDateTime = `${dateStr}T${startTimeStr}:00`;
        const endDateTime = `${dateStr}T${endTimeStr}:00`;

        const requestBody = {
            name: formData.name,
            gafEmail: formData.gafEmail,
            phoneNumber: formData.phoneNumber,
            gafId: formData.gafId,
            position: formData.position,
            committeeId: parseInt(formData.committeeId),                         
            subCommitteeId: formData.subcommitteeId ? parseInt(formData.subcommitteeId) : null,
            startTime: startDateTime,
            endTime: endDateTime,
            supervisorId: parseInt(formData.supervisorId) 
        };

        console.log('Scheduling interview with data:', requestBody);

        createInterviewMutation.mutate(requestBody, {
            onSuccess: (newInterview) => {
                console.log('Interview scheduled successfully:', newInterview);
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("Interview scheduled successfully!");
                setTimeout(() => {
                    setShowStatus(false);
                    handleCloseModal();
                }, 3000);
            },
            onError: () => {
                console.error('Error scheduling interview');
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error scheduling interview, please try again");
                setTimeout(() => {
                    setShowStatus(false);
                    handleCloseModal();
                }, 3000);
            }
        });
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
                        <TouchableOpacity onPress={showStatus ? undefined : handleCloseModal} disabled={showStatus} style={showStatus && styles.disabledButton}>
                            <Ionicons name="close" size={24} color={showStatus ? "#ccc" : "#666"} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Schedule Interview</Text>
                        <TouchableOpacity onPress={showStatus ? undefined : handleScheduleInterview} disabled={showStatus} style={showStatus && styles.disabledButton}>
                            <Text style={[styles.saveButton, showStatus && styles.disabledText]}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                        {/* Candidate Name */}
                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style = {styles.labelText}>Candidate Name</Text>
                                <Text style = {styles.labelRequirement}>*</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={(value) => updateFormData('name', value)}
                                placeholder="Enter candidate's full name"
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* Candidate Email */}
                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style = {styles.labelText}>Candidate Email (GAF Email)</Text>
                                <Text style = {styles.labelRequirement}>*</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={formData.gafEmail}
                                onChangeText={(value) => updateFormData('gafEmail', value)}
                                placeholder="Enter candidate's email"
                                placeholderTextColor="#999"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Phone Number */}
                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style = {styles.labelText}>Phone Number</Text>
                                <Text style = {styles.labelRequirement}>*</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={formData.phoneNumber}
                                onChangeText={(value) => updateFormData('phoneNumber', value)}
                                placeholder="Enter candidate's phonenumber"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Candidate ID */}
                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style = {styles.labelText}>Candidate ID (GAF ID)</Text>
                                <Text style = {styles.labelRequirement}>*</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={formData.gafId}
                                onChangeText={(value) => updateFormData('gafId', value)}
                                placeholder="Enter candidate's GAF ID"
                                placeholderTextColor="#999"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Position */}
                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style = {styles.labelText}>Position</Text>
                                <Text style = {styles.labelRequirement}>*</Text>
                            </View>
                            <View style={styles.pickerContainer}>
                                <RNPickerSelect
                                    onValueChange={(value) => {
                                        updateFormData('position', value);
                                    }}
                                    items={POSITIONS}
                                    value={formData.position}
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
                            <View style={styles.pickerContainer}>
                                <RNPickerSelect
                                    onValueChange={(value) => {
                                        updateFormData('committeeId', value);
                                        // Reset subcommittee when committee changes
                                        updateFormData('subCommitteeId', '');
                                    }}
                                    items={committees.map(committee => ({
                                        label: committee.name,
                                        value: committee.id.toString()
                                    }))}
                                    value={formData.committeeId}
                                    placeholder={{ label: committeesLoading ? "Loading committees..." : "Select committee...", value: "" }}
                                    disabled={committeesLoading}
                                    Icon={() => <Ionicons name="chevron-down" size={25} color="#666" />}
                                    style={pickerSelectStyles}
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
                                (!formData.committeeId || getSubcommittees().length === 0) && styles.pickerContainerDisabled
                            ]}>
                                <RNPickerSelect
                                    onValueChange={(value) => updateFormData('subcommitteeId', value)}
                                    items={getSubcommittees().map(subcommittee => ({
                                        label: subcommittee.name,
                                        value: subcommittee.id.toString()
                                    }))}
                                    value={formData.subcommitteeId}
                                    placeholder={{ 
                                        label: !formData.committeeId 
                                            ? "Select committee first..." 
                                            : getSubcommittees().length === 0 
                                                ? "No subcommittees available" 
                                                : "Select subcommittee...", 
                                        value: "" 
                                    }}
                                    disabled={!formData.committeeId || getSubcommittees().length === 0 || committeesLoading}
                                    Icon={() => <Ionicons name="chevron-down" size={25} color="#666" />}
                                    style={pickerSelectStyles}
                                />
                            </View>
                        </View>
                        {/* Supervisor */}
                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Interview Supervisor</Text>
                                <Text style={styles.labelRequirement}>*</Text>
                            </View>
                            
                            {/* Supervisor Selector */}
                            <TouchableOpacity 
                                onPress={() => setShowSupervisorDropdown(!showSupervisorDropdown)}
                                style={styles.supervisorSelector}
                            >
                                <Text style={[
                                    styles.supervisorSelectorText, 
                                    !getSelectedSupervisor() && styles.placeholderText
                                ]}>
                                    {getSelectedSupervisor() 
                                        ? `${getSelectedSupervisor()?.firstName} ${getSelectedSupervisor()?.lastName}`
                                        : "Select supervisor..."
                                    }
                                </Text>
                                <Ionicons 
                                    name={showSupervisorDropdown ? "chevron-up" : "chevron-down"} 
                                    size={20} 
                                    color="#666" 
                                />
                            </TouchableOpacity>
                            
                            {/* Dropdown */}
                            {showSupervisorDropdown && (
                                <View style={styles.supervisorDropdown}>
                                    <TextInput
                                        style={styles.searchInput}
                                        value={supervisorSearch}
                                        onChangeText={setSupervisorSearch}
                                        placeholder="Search supervisors..."
                                        placeholderTextColor="#999"
                                        autoCapitalize="none"
                                    />
                                    
                                    <ScrollView style={styles.supervisorList} keyboardShouldPersistTaps="handled">
                                        {usersLoading ? (
                                            <View style={styles.loadingContainer}>
                                                <Text style={styles.loadingText}>Loading users...</Text>
                                            </View>
                                        ) : getFilteredSupervisors().length === 0 ? (
                                            <View style={styles.emptyContainer}>
                                                <Text style={styles.emptyText}>No supervisors found</Text>
                                            </View>
                                        ) : (
                                            getFilteredSupervisors().map((user) => (
                                                <TouchableOpacity
                                                    key={user.id}
                                                    style={[
                                                        styles.supervisorOption,
                                                        formData.supervisorId === user.id.toString() && styles.selectedOption
                                                    ]}
                                                    onPress={() => {
                                                        updateFormData('supervisorId', user.id.toString());
                                                        setSupervisorSearch('');
                                                        setShowSupervisorDropdown(false);
                                                    }}
                                                >
                                                    <View style={styles.supervisorOptionContent}>
                                                        <Text style={styles.supervisorName}>
                                                            {user.firstName} {user.lastName}
                                                        </Text>
                                                        <Text style={styles.supervisorEmail}>{user.email}</Text>
                                                    </View>
                                                    {formData.supervisorId === user.id.toString() && (
                                                        <Ionicons name="checkmark" size={20} color="#E9435E" />
                                                    )}
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                        {/* Date */}
                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Date</Text>
                                <Text style={styles.labelRequirement}>*</Text>
                            </View>
                            
                            {/* Display selected date */}
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
                                        [formData.date]: {selected: true, disableTouchEvent: true}
                                    }}
                                    onDayPress={day => {
                                        console.log('selected day', day);
                                        updateFormData('date', day.dateString);
                                        setIsCalendarVisible(false);
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

                        {/* Start and End Time */}
                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Time</Text>
                                <Text style={styles.labelRequirement}>*</Text>
                            </View>
                            
                            <View style={styles.timeRow}>
                                {/* Start Time */}
                
                                <View style={styles.timeSelector}>
                                    <DateTimePicker
                                        style= {{marginLeft:-10}}
                                        value={formData.startTime}
                                        mode="time"
                                        display="compact"
                                        onChange={(event, time) => {
                                            
                                            if (time) {
                                                updateFormData('startTime', time);
                                            }
                                        }}
                                    />
                                    <Ionicons name="time-outline" size={18} color="#E9435E" />
                                </View>
                               

                                {/* Separator */}
                                <View style={styles.timeSeparator}>
                                    <Text style={styles.separatorText}>to</Text>
                                </View>

                                {/* End Time */}
                                <View style={styles.timeSelector}>
                                    <DateTimePicker
                                        style= {{
                                            marginLeft:-10,
                                        }}
                                        value={formData.endTime}

                                        mode="time"
                                        display="default"
                                        onChange={(event, time) => {
                                            if (time) {
                                                
                                                updateFormData('endTime', time);
                                            }
                                        }}
                                        minimumDate={formData.startTime}
                                    />
                                    <Ionicons name="time-outline" size={18} color="#E9435E" />
                                </View>
                            </View>
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

                    {(error || errorUsers) && (
                        <View style={styles.errorContainer}>
                            <Text style={{color: 'red'}}>Error loading data. Please try again later.</Text>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
    )
}

const styles = StyleSheet.create({
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
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveButton: {
        fontSize: 16,
        color: '#E9435E',
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.5,
    },
    disabledText: {
        color: '#ccc',
    },
    supervisorSelector: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 12,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    supervisorSelectorText: {
        fontSize: 16,
        color: '#333',
    },
    placeholderText: {
        color: '#999',
    },
    supervisorDropdown: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        backgroundColor: '#fff',
        marginTop: 8,
        maxHeight: 250,
    },
    searchInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        padding: 12,
        fontSize: 16,
    },
    supervisorList: {
        maxHeight: 200,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        color: '#666',
        fontSize: 14,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
    },
    supervisorOption: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedOption: {
        backgroundColor: '#f8f9fa',
    },
    supervisorOptionContent: {
        flex: 1,
    },
    supervisorName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    supervisorEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
})

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

export default ScheduleModal;