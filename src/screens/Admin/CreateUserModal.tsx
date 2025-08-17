import { useAuth } from '@/App';
import { Ionicons } from '@expo/vector-icons';
import { AxiosInstance } from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { StatusMessage } from '../../components/StatusMessage';
import { CommitteeType, SubcommitteeType, UserType } from '../../types/User';

const COMMITTEES_WITH_IDS: CommitteeType[] = [
    { id: 1, name: 'Human Resources & Development' },
    { id: 2, name: 'Executive Board' },
    { id: 3, name: 'Treasury' },
    { id: 4, name: 'Public Relations' },
    { id: 5, name: 'Entertainment & Events' },
    { id: 6, name: 'Officers' },
    { id: 7, name: 'Academic Affairs' },
    { id: 8, name: 'Sports' },
    { id: 9, name: 'Services' },
    { id: 10, name: 'Marketing' }
];

const SUBCOMMITTEES_WITH_IDS: SubcommitteeType[] = [
    // Human Resources & Development (committeeId: 1)
    { id: 1, name: 'Training & Development', committeeId: 1 },
    { id: 2, name: 'Recruitment, Documentation & Reports', committeeId: 1 },
    
    // Academic Affairs (committeeId: 7)
    { id: 3, name: 'Academic Concerns & Support (Representation)', committeeId: 7 },
    { id: 4, name: 'Careers and Internships', committeeId: 7 },
    
    // Marketing (committeeId: 10)
    { id: 5, name: 'Social Media', committeeId: 10 },
    { id: 6, name: 'OnGround Marketing', committeeId: 10 },
    
    // Public Relations (committeeId: 4)
    { id: 7, name: 'Corporate Relations', committeeId: 4 },
    { id: 8, name: 'Universities Relations', committeeId: 4 },
    
    // Sports (committeeId: 8)
    { id: 9, name: 'Sports Events', committeeId: 8 },
    { id: 10, name: 'Sports Representations & Service', committeeId: 8 },
    
    // Treasury (committeeId: 3)
    { id: 11, name: 'Fundraising & Budgeting', committeeId: 3 },
    { id: 12, name: 'ID Benefits', committeeId: 3 },
    
    // Services (committeeId: 9)
    { id: 13, name: 'Volunteering & Charity', committeeId: 9 },
    { id: 14, name: 'Sustainability & Eco Projects', committeeId: 9 },
    
    // Entertainment & Events (committeeId: 5)
    { id: 15, name: 'Continuous Events and Trips', committeeId: 5 },
    { id: 16, name: 'Competition', committeeId: 5 }
];

const CreateUserModal = ({ visible, onClose, onUpdate }: {
    visible: boolean;
    onClose: () => void;
    onUpdate: (user: UserType) => void;
}) => {
    const { api }: { api: AxiosInstance } = useAuth()!;
    const [committees, setCommittees] = useState<CommitteeType[]>([]);
    const [subcommittees, setSubcommittees] = useState<SubcommitteeType[]>([]);
    const [filteredSubcommittees, setFilteredSubcommittees] = useState<SubcommitteeType[]>([]);
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: '',
        committeeId: '',
        subcommitteeId: ''
    });
    
    // Status message state
    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    useEffect(() => {
        if (visible) {
            initializeCommitteesAndSubcommittees();
        }
    }, [visible]);

    useEffect(() => {
        // Filter subcommittees based on selected committee
        if (formData.committeeId) {
            const filtered = subcommittees.filter(sub => 
                sub.committeeId === parseInt(formData.committeeId)
            );
            setFilteredSubcommittees(filtered);
        } else {
            setFilteredSubcommittees([]);
        }
        // Reset subcommittee selection when committee changes
        setFormData(prev => ({ ...prev, subcommitteeId: '' }));
    }, [formData.committeeId]);

    const initializeCommitteesAndSubcommittees = () => {
        setCommittees(COMMITTEES_WITH_IDS);
        setSubcommittees(SUBCOMMITTEES_WITH_IDS);
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
            subcommitteeId: ''
        });
        onClose();
    };

    const handleCreateUser = async () => {
        if (!formData.email || !formData.password || !formData.firstName || 
            !formData.lastName || !formData.role || !formData.committeeId) {
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

        try {
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
                subcommitteeId: formData.subcommitteeId ? parseInt(formData.subcommitteeId) : null
            };

            console.log('Creating user with data:', requestBody);

            const response = await api.post('/users', requestBody);

            if (response.status === 201 || response.status === 200) {
                console.log('User created successfully:', response.data);
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("User created successfully!");
                const newUser = response.data;
                onUpdate(newUser);
            } else {
                setIsLoading(false);
                setIsSuccess(false);
                setResultMessage("Error creating user");
            }

        } catch (error: any) {
            console.error('Error creating user:', error);
            setIsLoading(false);
            setIsSuccess(false);
            
            // Handle specific error messages
            if (error.response?.data?.message) {
                setResultMessage(error.response.data.message);
            } else if (error.response?.status === 409) {
                setResultMessage("User with this email already exists");
            } else {
                setResultMessage("Error creating user, please try again");
            }
        } finally {
            setTimeout(() => {
                setShowStatus(false);
                if (isSuccess) {
                    handleCloseModal();
                }
            }, 3000);
        }
    };

    const ROLE_OPTIONS = [
        { label: 'Chairperson', value: 'CHAIR_PERSON' },
        { label: 'Associate Chairperson', value: 'ASSOCIATE_CHAIRPERSON' },
        { label: 'Leader', value: 'LEADER' },
        { label: 'Associate Leader', value: 'ASSOCIATE_LEADER' },
        { label: 'Member', value: 'MEMBER' }
    ];

    const getCommitteeOptions = () => {
        return committees.map(committee => ({
            label: committee.name,
            value: committee.id.toString()
        }));
    };

    const getSubcommitteeOptions = () => {
        return filteredSubcommittees.map(subcommittee => ({
            label: subcommittee.name,
            value: subcommittee.id.toString()
        }));
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
                                onValueChange={(value) => updateFormData('committeeId', value)}
                                items={getCommitteeOptions()}
                                value={formData.committeeId}
                                placeholder={{ label: "Select committee...", value: "" }}
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
                        <View style={[styles.pickerContainer, (!formData.committeeId || filteredSubcommittees.length===0) && styles.pickerContainerDisabled]}>
                            <RNPickerSelect
                                onValueChange={(value) => updateFormData('subcommitteeId', value)}
                                items={getSubcommitteeOptions()}
                                value={formData.subcommitteeId}
                                disabled={!formData.committeeId || filteredSubcommittees.length === 0}
                                placeholder={{ label: "Select subcommittee...", value: "" }}
                                style={pickerSelectStyles}
                                Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
                            />
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

export default CreateUserModal;