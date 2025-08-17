import { useAuth } from '@/App';
import { Ionicons } from '@expo/vector-icons';
import { AxiosInstance } from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusMessage } from '../../components/StatusMessage';
import { usePermissions } from '../../hooks/usePermissions';

import { CommentType, CrossCommitteeRequestType, DocumentType } from '../../types/Proposal';

const CrossCommitteeRequestDetailsModal = ({
    visible,
    selectedRequest,
    onClose,
}: {
    selectedRequest: CrossCommitteeRequestType | null;
    visible: boolean;
    onClose: () => void;
}) => {
    // Comments and documents data
    const [comments, setComments] = useState<CommentType[]>([]);
    const [documents, setDocuments] = useState<DocumentType[]>([]);
    const [newComment, setNewComment] = useState('');
    
    const auth = useAuth()!;
    const permissions = usePermissions(auth?.user ?? null);
    const { api }: { api: AxiosInstance } = useAuth()!;
    
    // Status message state
    const [showStatus, setShowStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [resultMessage, setResultMessage] = useState('');

    const fetchComments = async () => {
        try {
            const response = await api.get(`/proposals/cross-committee-requests/${selectedRequest!.id}/comments`);
            setComments(response.data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const fetchDocuments = async () => {
        try {
            const response = await api.get(`/proposals/cross-committee-requests/${selectedRequest!.id}/documents`);
            setDocuments(response.data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    useEffect(() => {
        if (selectedRequest) {
            fetchComments();
            fetchDocuments();
        }
    }, [selectedRequest]);

    if (!visible) return null;
    if (!selectedRequest) return null;

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            const response = await api.post(`/proposals/cross-committee-requests/${selectedRequest.id}/comments`, {
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
            await api.delete(`/proposals/cross-committee-requests/comments/${commentId}`);
            setComments(prev => prev.filter(comment => comment.id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
            Alert.alert('Error', 'Failed to delete comment');
        }
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
            const response = await api.get(`/proposals/cross-committee-requests/documents/${document.id}/download`);
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

            if (result.canceled) {
                return;
            }

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

            const response = await api.post(`/proposals/cross-committee-requests/${selectedRequest.id}/documents`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 201 || response.status === 200) {
                setDocuments(prev => [response.data, ...prev]);
                setIsLoading(false);
                setIsSuccess(true);
                setResultMessage(`${file.name} uploaded successfully!`);
            } else {
                throw new Error('Upload failed');
            }

        } catch (error) {
            console.error('Error uploading document:', error);
            setIsLoading(false);
            setIsSuccess(false);
            setResultMessage('Failed to upload document. Please try again.');
        } finally {
            setTimeout(() => {
                setShowStatus(false);
            }, 3000);
        }
    };

    const handleDeleteDocument = async (documentId: string) => {
        try {
            await api.delete(`/proposals/cross-committee-requests/documents/${documentId}`);
            setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        } catch (error) {
            console.error('Error deleting document:', error);
            Alert.alert('Error', 'Failed to delete document');
        }
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'IN_PROGRESS': return '#2196F3';
            case 'PENDING_REVIEW': return '#FF9800';
            case 'COMPLETED': return '#4CAF50';
            default: return '#666';
        }
    };

    // Permission checks
    const isRequester = selectedRequest.requester.id === auth?.user?.subcommitteeId;
    const isTargetCommittee = selectedRequest.targetCommittee.id === auth?.user?.committeeId;
    const canRespond = isTargetCommittee || isRequester;
    const canComment = selectedRequest.status !== 'COMPLETED' && canRespond;

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
                        <Text style={styles.modalTitle}>Cross-Committee Request</Text>
                    </View>

                    <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Request Information</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Title</Text>
                            </View>
                            <View style={styles.readOnlyInput}>
                                <Text style={styles.readOnlyText}>{selectedRequest.title}</Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Description</Text>
                            </View>
                            <View style={[styles.readOnlyInput, styles.readOnlyTextArea]}>
                                <Text style={styles.readOnlyText}>{selectedRequest.description}</Text>
                            </View>
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Request Details</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Requested By</Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{selectedRequest.requester.committeeName}</Text>
                                <Text style={styles.userEmail}>{selectedRequest.requester.commiteeSlug}</Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Target Committee</Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{selectedRequest.targetCommittee.committeeName}</Text>
                                <Text style={styles.userEmail}>{selectedRequest.targetCommittee.commiteeSlug}</Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Current Status</Text>
                            </View>
                            <View style={styles.statusContainer}>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedRequest.status) }]}>
                                    <Text style={styles.statusText}>
                                        {selectedRequest.status.replace('_', ' ')}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.label}>
                                <Text style={styles.labelText}>Created Date</Text>
                            </View>
                            <Text style={styles.dateText}>
                                {new Date(selectedRequest.createdAt).toLocaleDateString()}
                            </Text>
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
                                            <Ionicons name="send" size={20} color={newComment.trim() ? "#2196F3" : "#ccc"} />
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

                        {/* Documents Section */}
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
                                        color={showStatus ? "#ccc" : "#2196F3"} 
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
    readOnlyInput: {
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    readOnlyTextArea: {
        minHeight: 80,
    },
    readOnlyText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
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
    dateText: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
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
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2196F3',
        gap: 8,
        marginBottom: 12,
    },
    uploadButtonText: {
        fontSize: 16,
        color: '#2196F3',
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

export default CrossCommitteeRequestDetailsModal;