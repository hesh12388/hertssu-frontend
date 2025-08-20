import { useAuth } from '@/App';
import { useAddComment, useDeleteComment, useDeleteDocument, useProposalComments, useProposalCrossCommitteeRequests, useProposalDocuments, useUploadDocument } from '@/src/hooks/useProposalDetails';
import { useDeleteProposal, useUpdateProposal, useUpdateProposalStatus } from '@/src/hooks/useProposals';
import { Ionicons } from '@expo/vector-icons';
import { AxiosInstance } from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import RNPickerSelect from 'react-native-picker-select';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusMessage } from '../../components/StatusMessage';
import { CommentType, CrossCommitteeRequestType, DocumentType, ProposalType } from '../../types/Proposal';
import CreateCrossCommitteeRequestModal from './CreateCrossCommitteeRequestModal';
import CrossCommitteeRequestDetailsModal from './CrossCommitteeRequestDetailsModal';

const ProposalDetailsModal = ({
    visible,
    selectedProposal,
    onClose,
}: {
    selectedProposal: ProposalType | null;
    visible: boolean;
    onClose: () => void;
}) => {
    const [editData, setEditData] = useState<ProposalType | null>(null);
    const [activeTab, setActiveTab] = useState<'proposal' | 'crossCommittee'>('proposal');
    const [isEditCalendarVisible, setIsEditCalendarVisible] = useState(false);
    
    const [newComment, setNewComment] = useState('');
    const [isCreateCrossCommitteeModalVisible, setIsCreateCrossCommitteeModalVisible] = useState(false);
    const [selectedCrossCommitteeRequest, setSelectedCrossCommitteeRequest] = useState<CrossCommitteeRequestType | null>(null);
    const [showCrossCommitteeRequestDetails, setShowCrossCommitteeRequestDetails] = useState(false);

    const auth = useAuth()!;
    const { api }: { api: AxiosInstance } = useAuth()!;
    
    
    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    if (!visible) return null;
    if (!selectedProposal) return null;
    if (!editData) return null;

    const { data: comments = [], isLoading: commentsLoading, error: commentsError, isFetching: commentsFetching, refetch: fetchComments } = useProposalComments(selectedProposal.id);
    const { data: documents = [], isLoading: documentsLoading, error: documentsError, isFetching: documentsFetching, refetch: fetchDocuments } = useProposalDocuments(selectedProposal.id);
    const { data: crossCommitteeRequests = [], isLoading: crossCommitteeLoading, error: crossCommitteeError, isFetching: crossCommitteeFetching, refetch: fetchCrossCommittee } = useProposalCrossCommitteeRequests(selectedProposal?.id);

    const hasError = commentsError || documentsError || crossCommitteeError;
    const isFetching = commentsFetching || documentsFetching || crossCommitteeFetching;
    const loading = commentsLoading || documentsLoading || crossCommitteeLoading;


    const addCommentMutation = useAddComment();
    const deleteCommentMutation = useDeleteComment();
    const uploadDocumentMutation = useUploadDocument();
    const deleteDocumentMutation = useDeleteDocument();
    const updateProposalMutation = useUpdateProposal();
    const updateStatusMutation = useUpdateProposalStatus();
    const deleteProposalMutation = useDeleteProposal();

    useEffect(() => {
        if (selectedProposal) {
            setEditData({ ...selectedProposal });
        }
    }, [selectedProposal]);

    const updateEditData = (field: string, value: any) => {
        setEditData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                [field]: value
            };
        });
    };

    const handleUpdateProposal = async () => {
        if (!editData) return;
        if (!editData.title || !editData.description || !editData.dueDate || !editData.priority) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        setStatusMessage("Updating proposal...");
        setShowStatus(true);

        const requestBody = {
            title: editData.title,
            description: editData.description,
            dueDate: editData.dueDate,
            priority: editData.priority
        };

        updateProposalMutation.mutate(
            { proposalId: editData.id, data: requestBody },
            {
                onSuccess: (updatedProposal) => {
                    setIsLoading(false);
                    setIsSuccess(true);
                    setResultMessage("Proposal updated successfully!");
                    setEditData(updatedProposal); 
                   
                    setTimeout(() => setShowStatus(false), 3000);
                },
                onError: () => {
                    setIsLoading(false);
                    setIsSuccess(false);
                    setResultMessage("Error updating proposal, please try again");
                    setTimeout(() => setShowStatus(false), 3000);
                }
            }
        );
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!editData) return;

        setIsLoading(true);
        setStatusMessage("Updating status...");
        setShowStatus(true);

        updateStatusMutation.mutate(
            { proposalId: editData.id, status: newStatus },
            {
                onSuccess: (updatedProposal) => {
                    setIsLoading(false);
                    setIsSuccess(true);
                    setResultMessage("Status updated successfully!");
                    setEditData(updatedProposal); // Update local form state
                    setTimeout(() => setShowStatus(false), 2000);
                },
                onError: () => {
                    setIsLoading(false);
                    setIsSuccess(false);
                    setResultMessage("Error updating status, please try again");
                    setTimeout(() => setShowStatus(false), 2000);
                }
            }
        );
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        
        addCommentMutation.mutate({
            proposalId: editData!.id,
            content: newComment
        });
        setNewComment('');
    };

    const handleDeleteComment = async (commentId: string) => {
        deleteCommentMutation.mutate({
            commentId,
            proposalId: editData!.id
        });
    };

    const confirmDeleteComment = (comment: CommentType) => {
        Alert.alert(
            "Delete Comment",
            "Are you sure you want to delete this comment?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => handleDeleteComment(comment.id) }
            ]
        );
    };

    const handleDownloadDocument = async (document: DocumentType) => {
        try {
            const response = await api.get(`/proposals/documents/${document.id}/download`);
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
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size && file.size > maxSize) {
                Alert.alert('Error', 'File size must be less than 10MB');
                return;
            }

            setShowStatus(true);
            setIsLoading(true);
            setStatusMessage("Uploading document...");

            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.mimeType || 'application/octet-stream',
                name: file.name,
            } as any);

            uploadDocumentMutation.mutate({
                proposalId: editData!.id,
                formData
            }, {
                onSuccess: () => {
                    setIsLoading(false);
                    setIsSuccess(true);
                    setResultMessage(`${file.name} uploaded successfully!`);
                    setTimeout(() => setShowStatus(false), 3000);
                },
                onError: () => {
                    setIsLoading(false);
                    setIsSuccess(false);
                    setResultMessage('Failed to upload document. Please try again.');
                    setTimeout(() => setShowStatus(false), 3000);
                }
            });

        } catch (error) {
            console.error('Error selecting document:', error);
            setIsLoading(false);
            setIsSuccess(false);
            setResultMessage('Failed to upload document. Please try again.');
            setTimeout(() => setShowStatus(false), 3000);
        }
    };

    const handleDeleteDocument = async (documentId: string) => {
        deleteDocumentMutation.mutate({
            documentId,
            proposalId: editData!.id
        });
    };

    const confirmDeleteDocument = (document: DocumentType) => {
        Alert.alert(
            "Delete Document",
            `Are you sure you want to delete "${document.fileName}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => handleDeleteDocument(document.id) }
            ]
        );
    };
    
    const handleDeleteProposal = async () => {
        if (!editData) return;

        setIsLoading(true);
        setStatusMessage("Deleting proposal...");
        setShowStatus(true);

        deleteProposalMutation.mutate(
            { proposalId: editData.id },
            {
                onSuccess: () => {
                    setIsLoading(false);
                    setIsSuccess(true);
                    setResultMessage("Proposal deleted successfully!");
                    
                    // Close the modal after successful deletion
                    setTimeout(() => {
                        setShowStatus(false);
                        onClose();
                    }, 2000);
                },
                onError: () => {
                    setIsLoading(false);
                    setIsSuccess(false);
                    setResultMessage("Error deleting proposal, please try again");
                    setTimeout(() => setShowStatus(false), 3000);
                }
            }
        );
    };

    const confirmDeleteProposal = () => {
        Alert.alert(
            "Delete Proposal",
            `Are you sure you want to delete "${editData?.title}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: handleDeleteProposal }
            ]
        );
    };

    const handleCreateCrossCommitteeRequest = () => {
        setIsCreateCrossCommitteeModalVisible(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'IN_PROGRESS': return '#2196F3';
            case 'PENDING_REVIEW': return '#FF9800';
            case 'COMPLETED': return '#4CAF50';
            default: return '#666';
        }
    };

    const PRIORITY_OPTIONS = [
        { label: 'Low', value: 'LOW' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'High', value: 'HIGH' }
    ];

    // Permission checks
    const isAssignee = editData.assignee.id === auth?.user?.subcommitteeId;
    const isAssigner = editData.assigner.id === auth?.user?.committeeId && !isAssignee;
    
    const canEdit = isAssigner && editData.status !== 'COMPLETED';
    const canComment = editData.status !== 'COMPLETED' && (isAssigner || isAssignee);
    const canRequestApproval = isAssignee && editData.status === 'IN_PROGRESS';
    const canApproveReject = isAssigner && editData.status === 'PENDING_REVIEW';
    const canCreateCrossCommitteeRequest = isAssignee && editData.status === 'IN_PROGRESS';

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
                        <Text style={styles.modalTitle}>Proposal Details</Text>
                    </View>

                    {/* Tab Selector */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity 
                            style={[styles.tab, activeTab === 'proposal' && styles.activeTab]}
                            onPress={() => setActiveTab('proposal')}
                        >
                            <Text style={[styles.tabText, activeTab === 'proposal' && styles.activeTabText]}>
                                Main Proposal
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tab, activeTab === 'crossCommittee' && styles.activeTab]}
                            onPress={() => setActiveTab('crossCommittee')}
                        >
                            <Text style={[styles.tabText, activeTab === 'crossCommittee' && styles.activeTabText]}>
                                Cross-Committee Requests ({crossCommitteeRequests.length})
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                    style={styles.modalContent} 
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching}
                            onRefresh={() => {
                                fetchComments();
                                fetchDocuments();
                                fetchCrossCommittee();
                            }}
                            colors={['#E9435E']}
                            tintColor="#E9435E"
                        />
                    }
                    >
                        
                        {activeTab === 'proposal' ? (
                            <>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Proposal Information</Text>
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
                                        placeholder="Enter proposal title"
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
                                        placeholder="Enter proposal description"
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
                                        <Text style={styles.userName}>{editData.assigner.committeeName}</Text>
                                        <Text style={styles.userEmail}>{editData.assigner.commiteeSlug}</Text>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={styles.label}>
                                        <Text style={styles.labelText}>Assigned To</Text>
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userName}>{editData.assignee.committeeName}</Text>
                                        <Text style={styles.userEmail}>{editData.assignee.commiteeSlug}</Text>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={styles.label}>
                                        <Text style={styles.labelText}>Current Status</Text>
                                    </View>
                                    <View style={styles.statusContainer}>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(editData.status) }]}>
                                            <Text style={styles.statusText}>
                                                {editData.status.replace('_', ' ')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                
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

                                
                                {canCreateCrossCommitteeRequest && (
                                    <TouchableOpacity 
                                        style={styles.createCrossCommitteeButton}
                                        onPress={handleCreateCrossCommitteeRequest}
                                    >
                                        <Ionicons name="add-circle-outline" size={20} color="#2196F3" />
                                        <Text style={styles.createCrossCommitteeButtonText}>
                                            Create Cross-Committee Request
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                
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
                                            <View style={styles.commentFooter}>
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

                                
                                <View>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Documents</Text>
                                    </View>
                                    
                                    {canComment && (
                                        <TouchableOpacity 
                                            style={[styles.uploadButton, showStatus && styles.uploadButtonDisabled]}
                                            onPress={handleUploadDocument}
                                            disabled={showStatus}
                                        >
                                            <Ionicons 
                                                name="cloud-upload-outline" 
                                                size={20} 
                                                color={showStatus ? "#ccc" : "#E9435E"} 
                                            />
                                            <Text style={[styles.uploadButtonText, showStatus && styles.uploadButtonTextDisabled]}>
                                                {showStatus ? 'Uploading...' : 'Upload Document'}
                                            </Text>
                                        </TouchableOpacity>
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
                                
                                {/* Delete Button */}
                                {canEdit && (
                                    <TouchableOpacity 
                                        style={styles.deleteButton}
                                        onPress={confirmDeleteProposal}
                                        disabled={showStatus}
                                    >
                                        <Text style={styles.deleteButtonText}>Delete Proposal</Text>
                                    </TouchableOpacity>
                                )}

                                {/* Save Button */}
                                {canEdit && (
                                    <TouchableOpacity 
                                        style={styles.saveButton}
                                        onPress={handleUpdateProposal}
                                        disabled={showStatus}
                                    >
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Cross-Committee Requests</Text>
                                </View>

                                {crossCommitteeRequests.length === 0 ? (
                                    <View style={styles.emptySection}>
                                        <Text style={styles.emptyText}>No cross-committee requests for this proposal</Text>
                                        {canCreateCrossCommitteeRequest && (
                                            <TouchableOpacity 
                                                style={styles.createFirstCrossCommitteeButton}
                                                onPress={handleCreateCrossCommitteeRequest}
                                            >
                                                <Ionicons name="add-circle-outline" size={24} color="#2196F3" />
                                                <Text style={styles.createFirstCrossCommitteeButtonText}>
                                                    Create First Request
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : (
                                    <>
                                        {canCreateCrossCommitteeRequest && (
                                            <TouchableOpacity 
                                                style={styles.createCrossCommitteeButton}
                                                onPress={handleCreateCrossCommitteeRequest}
                                            >
                                                <Ionicons name="add-circle-outline" size={20} color="#2196F3" />
                                                <Text style={styles.createCrossCommitteeButtonText}>
                                                    Create New Request
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        {crossCommitteeRequests.map((request) => (
                                            <TouchableOpacity 
                                                key={request.id} 
                                                style={styles.crossCommitteeRequestItem}
                                                onPress={() => {
                                                    setSelectedCrossCommitteeRequest(request);
                                                    setShowCrossCommitteeRequestDetails(true);
                                                }}
                                            >
                                                <View style={styles.crossCommitteeRequestHeader}>
                                                    <Text style={styles.crossCommitteeRequestTitle}>{request.title}</Text>
                                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                                                        <Text style={styles.statusText}>
                                                            {request.status.replace('_', ' ')}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.crossCommitteeRequestDescription} numberOfLines={2}>
                                                    {request.description}
                                                </Text>
                                                <View style={styles.crossCommitteeRequestMeta}>
                                                    <Text style={styles.crossCommitteeRequestTarget}>
                                                        To: {request.targetCommittee.committeeName}
                                                    </Text>
                                                    <Text style={styles.crossCommitteeRequestDate}>
                                                        {new Date(request.createdAt).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </>
                                )}
                            </>
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

    
            {(loading) && (
                <View style={styles.statusOverlay}>
                    <StatusMessage 
                        isLoading={true}
                        isSuccess={false}
                        loadingMessage="Loading proposal details..."
                        resultMessage=""
                    />
                </View>
            )}

            {(hasError) && !showStatus && (
                <View style={styles.errorContainer}>
                    <Text style={{color: 'red'}}>Error loading data. Please try again later.</Text>
                </View>
            )}

            <CreateCrossCommitteeRequestModal 
                visible={isCreateCrossCommitteeModalVisible}
                proposalId={editData.id}
                onClose={() => setIsCreateCrossCommitteeModalVisible(false)} 
            />

            <CrossCommitteeRequestDetailsModal 
                visible={showCrossCommitteeRequestDetails}
                selectedRequest={selectedCrossCommitteeRequest}
                onClose={() => setShowCrossCommitteeRequestDetails(false)} 
            />
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
    errorContainer: {
        padding: 20,
        backgroundColor: '#ffebee',
        margin: 10,
        borderRadius: 8,
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        marginHorizontal: 20,
        marginVertical: 10,
        borderRadius: 8,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#E9435E',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
        textAlign: 'center',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '600',
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
    createCrossCommitteeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2196F3',
        gap: 8,
        marginBottom: 20,
    },
    createCrossCommitteeButtonText: {
        fontSize: 16,
        color: '#2196F3',
        fontWeight: '500',
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
    deleteButtonText: {
        color: '#E9435E',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        width: '100%',
        backgroundColor: 'white',
        borderColor: '#E9435E',
        borderWidth: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        marginTop: 20,
    },
    emptySection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginBottom: 16,
    },
    createFirstCrossCommitteeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2196F3',
        gap: 8,
    },
    createFirstCrossCommitteeButtonText: {
        fontSize: 16,
        color: '#2196F3',
        fontWeight: '600',
    },
    crossCommitteeRequestItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e3f2fd',
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
    },
    crossCommitteeRequestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    crossCommitteeRequestTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 12,
    },
    crossCommitteeRequestDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        lineHeight: 20,
    },
    crossCommitteeRequestMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    crossCommitteeRequestTarget: {
        fontSize: 12,
        color: '#2196F3',
        fontWeight: '500',
    },
    crossCommitteeRequestDate: {
        fontSize: 12,
        color: '#666',
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

export default ProposalDetailsModal;