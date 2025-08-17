import { useAuth } from '@/App';
import { Ionicons } from '@expo/vector-icons';
import { AxiosInstance } from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import RNPickerSelect from 'react-native-picker-select';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusMessage } from '../../components/StatusMessage';
import { TaskCommentType, TaskDocumentType, TaskType, getAssigneeEmail, getAssigneeName, getAssignerEmail, getAssignerName, getPriorityColor } from '../../types/Task';

const TaskDetailsModal = ({
    visible,
    selectedTask,
    onClose,
    onUpdate
}: {
    selectedTask: TaskType | null;
    visible: boolean;
    onClose: () => void;
    onUpdate: (task: TaskType) => void;
}) => {
    const [editData, setEditData] = useState<TaskType | null>(null);
    const [isEditCalendarVisible, setIsEditCalendarVisible] = useState(false);
    const [comments, setComments] = useState<TaskCommentType[]>([]);
    const [documents, setDocuments] = useState<TaskDocumentType[]>([]);
    const [newComment, setNewComment] = useState('');
    
    const auth = useAuth()!;
    const { api }: { api: AxiosInstance } = useAuth()!;
    
    // Status message state
    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

        
    const fetchComments = async () => {
        try {
            const response = await api.get(`/tasks/${selectedTask!.id}/comments`);
            setComments(response.data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const fetchDocuments = async () => {
        try {
            const response = await api.get(`/tasks/${selectedTask!.id}/documents`);
            setDocuments(response.data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    useEffect(() => {
        if (selectedTask) {
            setEditData({ ...selectedTask });
            fetchComments();
            fetchDocuments();
        }
    }, [selectedTask]);

    if (!visible) return null;         
    if (!selectedTask) return null;      
    if (!editData) return null;  

    

    const updateEditData = (field: string, value: any) => {
        setEditData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                [field]: value
            };
        });
    };

    const handleUpdateTask = async () => {
        if (!editData) return;
        if (!editData.title || !editData.description || !editData.dueDate || !editData.priority) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setIsLoading(true);
            setStatusMessage("Updating task...");
            setShowStatus(true);

            const requestBody = {
                title: editData.title,
                description: editData.description,
                dueDate: editData.dueDate,
                priority: editData.priority
            };

            const response = await api.put(`/tasks/${editData.id}`, requestBody);

            if (response.status === 200) {
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("Task updated successfully!");
                onUpdate(response.data);
            } else {
                setIsLoading(false);
                setIsSuccess(false);
            }

        } catch (error) {
            console.error('Error updating task:', error);
            setIsLoading(false);
            setIsSuccess(false);
            setResultMessage("Error updating task, please try again");
        } finally {
            setTimeout(() => {
                setShowStatus(false);
                if (isSuccess) {
                    onClose();
                }
            }, 3000);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!editData) return;

        try {
            setIsLoading(true);
            setStatusMessage("Updating status...");
            setShowStatus(true);

            const response = await api.patch(`/tasks/${editData.id}/status`, { status: newStatus });

            if (response.status === 200) {
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage("Status updated successfully!");
                const updatedTask: TaskType = response.data;
                setEditData(updatedTask);
                onUpdate(updatedTask);
            } else {
                setIsLoading(false);
                setIsSuccess(false);
            }

        } catch (error) {
            console.error('Error updating status:', error);
            setIsLoading(false);
            setIsSuccess(false);
            setResultMessage("Error updating status, please try again");
        } finally {
            setTimeout(() => {
                setShowStatus(false);
            }, 2000);
        }
    };

 

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            const response = await api.post(`/tasks/${editData!.id}/comments`, {
                content: newComment
            });

            if (response.status === 201 || response.status === 200) {
                setComments(prev => [response.data, ...prev]);
                setNewComment('');
            }

        } catch (error) {
            console.error('Error adding comment:', error);
            Alert.alert('Error', 'Failed to add comment');
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await api.delete(`/tasks/comments/${commentId}`);
            setComments(prev => prev.filter(comment => comment.id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
            Alert.alert('Error', 'Failed to delete comment');
        }
    };

    const confirmDeleteComment = (comment: TaskCommentType) => {
        Alert.alert(
            "Delete Comment",
            "Are you sure you want to delete this comment?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => handleDeleteComment(comment.id) }
            ]
        );
    };

    const handleDownloadDocument = async (document: TaskDocumentType) => {
        try {
            const response = await api.get(`/tasks/documents/${document.id}/download`);
            const presignedUrl = response.data.downloadUrl;
            
            if (presignedUrl) {
                await Linking.openURL(presignedUrl);
            }
        } catch (error) {
            console.error('Error downloading document:', error);
            Alert.alert('Error', 'Failed to download document');
        }
    };

    const handleUploadDocument = async () => {
        try {
            // Pick document using Expo DocumentPicker
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled) {
                return;
            }

            const file = result.assets[0];
            
            // Validate file size (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size && file.size > maxSize) {
                Alert.alert('Error', 'File size must be less than 10MB');
                return;
            }

          
            setShowStatus(true);
            setIsLoading(true);
            setStatusMessage("Uploading document...");
            
            // Create FormData
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.mimeType || 'application/octet-stream',
                name: file.name,
            } as any);

            console.log('Uploading file:', {
                name: file.name,
                size: file.size,
                type: file.mimeType,
                uri: file.uri
            });

            // Upload with progress tracking
            const response = await api.post(`/tasks/${editData!.id}/documents`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 201 || response.status === 200) {
                setDocuments(prev => [response.data, ...prev]);
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage(`${file.name} uploaded successfully!`);
                console.log('Document uploaded successfully:', response.data);
            } else {
                throw new Error('Upload failed');
            }

        } catch (error) {
            console.error('Error uploading document:', error);
            setIsLoading(false);
            setIsSuccess(false);
            setResultMessage('Failed to upload document. Please try again.');
        } finally {
            // Hide status after 3 seconds
            setTimeout(() => {
                setShowStatus(false);
            }, 3000);
        }
    };

    const handleDeleteDocument = async (documentId: string) => {
        try {
            await api.delete(`/tasks/documents/${documentId}`);
            setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        } catch (error) {
            console.error('Error deleting document:', error);
            Alert.alert('Error', 'Failed to delete document');
        }
    };

    const confirmDeleteDocument = (document: TaskDocumentType) => {
        Alert.alert(
            "Delete Document",
            `Are you sure you want to delete "${document.fileName}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => handleDeleteDocument(document.id) }
            ]
        );
    };

    

    const PRIORITY_OPTIONS = [
        { label: 'Low', value: 'LOW' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'High', value: 'HIGH' }
    ];

    const isAssigner = getAssignerEmail(editData) === auth?.user?.email;
    const isAssignee = getAssigneeEmail(editData) === auth?.user?.email;
    const canEdit = isAssigner && editData.status !== 'COMPLETED';
    const canComment = editData.status !== 'COMPLETED';
    const canRequestApproval = isAssignee && editData.status === 'IN_PROGRESS';
    const canApproveReject = isAssigner && editData.status === 'PENDING_REVIEW';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={showStatus ? () => {} : onClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                <KeyboardAvoidingView  
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.container}
                        keyboardVerticalOffset={50}
                >
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onClose} disabled={showStatus}>
                            <Ionicons name="close" size={24} color={showStatus ? "#ccc" : "#666"} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Task Details</Text>
                    </View>

                    <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Task Information</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Title</Text>
                                <Text style={styles.labelRequirement}>*</Text>
                            </View>
                            <TextInput
                                style={[styles.input, !canEdit && styles.inputDisabled]}
                                value={editData.title}
                                onChangeText={(value) => updateEditData('title', value)}
                                editable={canEdit}
                                placeholder="Enter task title"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Description</Text>
                                <Text style={styles.labelRequirement}>*</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.textArea, !canEdit && styles.inputDisabled]}
                                value={editData.description}
                                onChangeText={(value) => updateEditData('description', value)}
                                editable={canEdit}
                                placeholder="Enter task description"
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Priority</Text>
                                <Text style={styles.labelRequirement}>*</Text>
                            </View>
                            <View style={[styles.pickerContainer, !canEdit && styles.pickerContainerDisabled]}>
                                <RNPickerSelect
                                    onValueChange={(value) => updateEditData('priority', value)}
                                    items={PRIORITY_OPTIONS}
                                    value={editData.priority}
                                    placeholder={{ label: "Select priority...", value: "" }}
                                    disabled={!canEdit}
                                    style={pickerSelectStyles}
                                    Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Due Date</Text>
                                <Text style={styles.labelRequirement}>*</Text>
                            </View>
                            
                            <TouchableOpacity 
                                style={[styles.dateDisplay, !canEdit && styles.pickerContainerDisabled]} 
                                onPress={canEdit ? () => setIsEditCalendarVisible(!isEditCalendarVisible) : () => {}}
                            >
                                <Text style={styles.dateText}>
                                    {new Date(editData.dueDate).toLocaleDateString()}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color="#E9435E" />
                            </TouchableOpacity>
                                    
                            {isEditCalendarVisible && canEdit && (
                                <Calendar
                                    current={editData.dueDate}
                                    markedDates={{
                                        [editData.dueDate]: {
                                            selected: true, 
                                            selectedColor: '#E9435E'
                                        }
                                    }}
                                    onDayPress={day => {
                                        updateEditData('dueDate', day.dateString);
                                        setIsEditCalendarVisible(false);
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

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Assignment Details</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Assigned By</Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{getAssignerName(editData)}</Text>
                                <Text style={styles.userEmail}>{getAssignerEmail(editData)}</Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Assigned To</Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{getAssigneeName(editData)}</Text>
                                <Text style={styles.userEmail}>{getAssigneeEmail(editData)}</Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Current Status</Text>
                            </View>
                            <View style={styles.statusContainer}>
                                <View style={[styles.statusBadge, { backgroundColor: getPriorityColor(editData.status) }]}>
                                    <Text style={styles.statusText}>
                                        {editData.status.replace('_', ' ')}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Status Action Buttons */}
                        <View style={styles.actionButtonsContainer}>
                            {canRequestApproval && (
                                <TouchableOpacity 
                                    style={styles.actionButton}
                                    onPress={() => handleStatusChange('PENDING_REVIEW')}
                                    disabled={showStatus}
                                >
                                    <Text style={styles.actionButtonText}>Request Approval</Text>
                                </TouchableOpacity>
                            )}
                            
                            {canApproveReject && (
                                <View style={styles.approvalButtons}>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, styles.approveButton]}
                                        onPress={() => handleStatusChange('COMPLETED')}
                                        disabled={showStatus}
                                    >
                                        <Text style={[styles.actionButtonText, styles.approveButtonText]}>Approve</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={[styles.actionButton, styles.rejectButton]}
                                        onPress={() => handleStatusChange('IN_PROGRESS')}
                                        disabled={showStatus}
                                    >
                                        <Text style={styles.actionButtonText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Comments Section */}
                        <View>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Comments</Text>
                            </View>

                                {canComment && (
                                <View style={styles.inputGroup}>
                                    <View style={styles.addCommentContainer}>
                                        <TextInput
                                            style={[styles.input, styles.commentInput]}
                                            value={newComment}
                                            onChangeText={setNewComment}
                                            placeholder="Add a comment..."
                                            placeholderTextColor="#999"
                                            multiline
                                        />
                                        <TouchableOpacity 
                                            style={styles.addCommentButton}
                                            onPress={handleAddComment}
                                            disabled={!newComment.trim()}
                                        >
                                            <Ionicons name="send" size={20} color={newComment.trim() ? "#E9435E" : "#ccc"} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                )}
                            {comments.map((comment) => (
                                <View key={comment.id} style={styles.commentItem}>
                                    <View style={styles.commentHeader}>
                                        <Text style={styles.commentAuthor}>{comment.user.name}</Text>
                                        <View style={styles.commentActions}>
                                            <Text style={styles.commentDate}>
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </Text>
                                            
                                        </View>
                                    </View>
                                    <View style ={styles.commentFooter}>
                                        <Text style={styles.commentContent}>{comment.content}</Text>
                                        {(comment.user.email === auth?.user?.email && canComment) && (
                                                <TouchableOpacity onPress={() => confirmDeleteComment(comment)}>
                                                    <Ionicons name="trash-outline" size={16} color="#ff4444" />
                                                </TouchableOpacity>
                                            )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    

                        {/* Documents Section */}
                        <View>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Documents</Text>
                            </View>
                            {canComment && (
                                <>
                                <TouchableOpacity 
                                    style={[styles.uploadButton, showStatus && styles.uploadButtonDisabled]}
                                    onPress={handleUploadDocument}
                                    disabled={showStatus}
                                >
                                    <Ionicons 
                                        name="cloud-upload-outline" 
                                        size={20} 
                                        color={(showStatus) ? "#ccc" : "#E9435E"} 
                                    />
                                    <Text style={[styles.uploadButtonText, showStatus && styles.uploadButtonTextDisabled]}>
                                        {showStatus ? 'Uploading...' : 'Upload Document'}
                                    </Text>
                                </TouchableOpacity>
                                </>
                            )}

                            {documents.map((document) => (
                                <View key={document.id} style={styles.documentItem}>
                                    <TouchableOpacity 
                                        style={styles.documentInfo}
                                        onPress={() => handleDownloadDocument(document)}
                                    >
                                        <Ionicons name="document-outline" size={24} color="#666" />
                                        <View style={styles.documentDetails}>
                                            <Text style={styles.documentName}>{document.fileName}</Text>
                                            <Text style={styles.documentMeta}>
                                                {(document.fileSize / 1024).toFixed(1)} KB • {document.uploadedBy.name}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                    
                                    {document.uploadedBy.email === auth?.user?.email && (
                                        <TouchableOpacity onPress={() => confirmDeleteDocument(document)}>
                                            <Ionicons name="trash-outline" size={20} color="#ff4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                        {/* Save Button */}
                        {canEdit && (
                            <TouchableOpacity 
                                style={styles.saveButton}
                                onPress={handleUpdateTask}
                                disabled={showStatus}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        )}
                        
                    </ScrollView>
        
                </KeyboardAvoidingView>
            </SafeAreaView>
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
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        gap: 30,
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
        marginTop: 0,
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
    inputDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#ccc',
        color: '#666',
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
    userInfo: {
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    statusContainer: {
        flexDirection: 'row',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    actionButtonsContainer: {
        marginBottom: 0,
    },
    actionButton: {
        backgroundColor: '#E9435E',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        marginBottom: 8,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    approvalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    approveButton: {
        backgroundColor: '#4CAF50',
        flex: 1,
    },
    approveButtonText: {
        color: 'white',
    },
    rejectButton: {
        backgroundColor: '#F44336',
        flex: 1,
    },
    addCommentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    commentInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
    },
    addCommentButton: {
        padding: 12,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentItem: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    commentDate: {
        fontSize: 12,
        color: '#666',
    },
    commentContent: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    commentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E9435E',
        gap: 8,
        marginBottom: 12,
    },
    uploadButtonText: {
        fontSize: 16,
        color: '#E9435E',
        fontWeight: '500',
    },
    uploadButtonDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#ccc',
    },
    uploadButtonTextDisabled: {
        color: '#ccc',
    },
    progressContainer: {
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#E9435E',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        fontWeight: '500',
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 8,
    },
    documentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    documentDetails: {
        flex: 1,
    },
    documentName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    documentMeta: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    saveButton: {
        width: '100%',
        backgroundColor: '#E9435E',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        marginTop: 20,
    },
    saveButtonText: {
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
        top: 10
    }
};

export default TaskDetailsModal;