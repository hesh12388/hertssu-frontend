import { useCommittees } from '@/src/hooks/useCommittees';
import { useCreateUser, useUsers } from '@/src/hooks/useUsers';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { StatusMessage } from '../../components/StatusMessage';


const CreateUserModal = ({ visible, onClose }: {
    visible: boolean;
    onClose: () => void;
}) => {
    
    const createUserMutation = useCreateUser();
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: '',
        committeeId: '',
        subcommitteeId: '',
        supervisorId: ''
    });
    
    const { data: committees = [], isLoading: committeesLoading, error } = useCommittees();

    // Status message state
    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');
    const [supervisorSearch, setSupervisorSearch] = useState('');
    const [showSupervisorDropdown, setShowSupervisorDropdown] = useState(false);
    const { data: users = [], isLoading: usersLoading, error: errorUsers } = useUsers();
    
     const getSubcommittees = () => {
        if (!formData.committeeId) return [];
        const selectedCommittee = committees.find(c => c.id.toString() === formData.committeeId);
        return selectedCommittee?.subcommittees || [];
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCloseModal = () => {
        // Reset form
        setFormData({
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            role: '',
            committeeId: '',
            subcommitteeId: '',
            supervisorId: ''
        });
        setSupervisorSearch('');
        setShowSupervisorDropdown(false);
        onClose();
    };

    const handleCreateUser = async () => {
        if (!formData.email || !formData.password || !formData.firstName ||
            !formData.lastName || !formData.role || !formData.committeeId || !formData.supervisorId) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        // Password validation
        if (formData.password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);
        setStatusMessage("Creating new user...");
        setShowStatus(true);

        const requestBody = {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            committeeId: parseInt(formData.committeeId),
            subcommitteeId: formData.subcommitteeId ? parseInt(formData.subcommitteeId) : null,
            supervisorId: formData.supervisorId ? parseInt(formData.supervisorId) : null
        };

        console.log('Creating user with data:', requestBody);

        createUserMutation.mutate(requestBody, {
            onSuccess: (newUser) => {
                console.log('User created successfully:', newUser);
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("User created successfully!");
                
                setTimeout(() => {
                    setShowStatus(false);
                    handleCloseModal();
                }, 3000);
            },
            onError: (error: any) => {
                console.error('Error creating user:', error);
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error creating user, please try again");
                
                
                setTimeout(() => {
                    setShowStatus(false);
                }, 3000);
            }
        });
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
    const ROLE_OPTIONS = [
        { label: 'Chairperson', value: 'CHAIR_PERSON' },
        { label: 'Associate Chairperson', value: 'ASSOCIATE_CHAIRPERSON' },
        { label: 'Leader', value: 'LEADER' },
        { label: 'Associate Leader', value: 'ASSOCIATE_LEADER' },
        { label: 'Member', value: 'MEMBER' }
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
                    <Text style={styles.modalTitle}>Create New User</Text>
                    <TouchableOpacity 
                        onPress={showStatus ? undefined : handleCreateUser} 
                        disabled={showStatus}
                    >
                        <Text style={[styles.saveButton, showStatus && styles.disabledText]}>Create</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                    
                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Email</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={formData.email}
                            onChangeText={(value) => updateFormData('email', value)}
                            placeholder="Enter email address"
                            placeholderTextColor="#999"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                    </View>

                    {/* Password */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Password</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={formData.password}
                            onChangeText={(value) => updateFormData('password', value)}
                            placeholder="Enter password (min 6 characters)"
                            placeholderTextColor="#999"
                            secureTextEntry
                            autoCapitalize="none"
                        />
                    </View>

                    {/* First Name */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>First Name</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={formData.firstName}
                            onChangeText={(value) => updateFormData('firstName', value)}
                            placeholder="Enter first name"
                            placeholderTextColor="#999"
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Last Name */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Last Name</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={formData.lastName}
                            onChangeText={(value) => updateFormData('lastName', value)}
                            placeholder="Enter last name"
                            placeholderTextColor="#999"
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Role */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Role</Text>
                            <Text style={styles.labelRequirement}>*</Text>
                        </View>
                        <View style={styles.pickerContainer}>
                            <RNPickerSelect
                                onValueChange={(value) => updateFormData('role', value)}
                                items={ROLE_OPTIONS}
                                value={formData.role}
                                placeholder={{ label: "Select role...", value: "" }}
                                style={pickerSelectStyles}
                                Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
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
                                    updateFormData('subcommitteeId', '');
                                }}
                                items={committees.map(committee => ({
                                    label: committee.name,
                                    value: committee.id.toString()
                                }))}
                                value={formData.committeeId}
                                placeholder={{ 
                                    label: committeesLoading ? "Loading committees..." : "Select committee...", 
                                    value: "" 
                                }}
                                disabled={committeesLoading}
                                style={pickerSelectStyles}
                                Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
                            />
                        </View>
                    </View>

                    {/* Subcommittee */}
                    <View style={styles.inputGroup}>
                        <View style={styles.label}>
                            <Text style={styles.labelText}>Subcommittee</Text>
                            <Text style={styles.labelOptional}>(Optional)</Text>
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
                                disabled={!formData.committeeId || getSubcommittees().length === 0 || committeesLoading}
                                placeholder={{ 
                                    label: !formData.committeeId 
                                        ? "Select committee first..." 
                                        : getSubcommittees().length === 0 
                                            ? "No subcommittees available" 
                                            : "Select subcommittee...", 
                                    value: "" 
                                }}
                                style={pickerSelectStyles}
                                Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
                            />
                        </View>
                        
                    </View>
                    {/* Supervisor */}
                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Supervisor</Text>
                                <Text style={styles.labelOptional}>(Optional)</Text>
                            </View>
                            
                            {/* Search Input */}
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
                                            <>
                                                <TouchableOpacity
                                                    style={styles.supervisorOption}
                                                    onPress={() => {
                                                        updateFormData('supervisorId', '');
                                                        setSupervisorSearch('');
                                                        setShowSupervisorDropdown(false);
                                                    }}
                                                >
                                                    <Text style={styles.clearOptionText}>Clear selection</Text>
                                                </TouchableOpacity>
                                                
                                                {getFilteredSupervisors().map((user) => (
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
                                                ))}
                                            </>
                                        )}
                                    </ScrollView>
                                </View>
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

                {(error || errorUsers) && (
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
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    errorContainer: {
        padding: 20,
        backgroundColor: '#ffebee',
        margin: 10,
        borderRadius: 8,
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
    labelOptional: {
        color: "#666",
        fontSize: 12,
        fontStyle: 'italic'
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
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        backgroundColor: '#fff',
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
    pickerContainerDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#ccc',
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
    clearOptionText: {
        fontSize: 16,
        color: '#E9435E',
        fontStyle: 'italic',
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
    },
};

export default CreateUserModal;