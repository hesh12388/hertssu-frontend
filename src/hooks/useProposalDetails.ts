import { useAuth } from '@/App';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CommentType, CrossCommitteeRequestType, DocumentType } from '../types/Proposal';

export const useProposalComments = (proposalId: number | undefined) => {
    const { api } = useAuth()!;
    
    return useQuery({
        queryKey: ['proposal-comments', proposalId],
        queryFn: async (): Promise<CommentType[]> => {
            if (!proposalId) return [];
            const response = await api.get(`/proposals/${proposalId}/comments`);
            return response.data || [];
        },
        enabled: !!proposalId,
    });
};

export const useAddComment = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ proposalId, content }: { proposalId: number; content: string }) => {
            const response = await api.post(`/proposals/${proposalId}/comments`, { content });
            return response.data;
        },
        onSuccess: (newComment, { proposalId }) => {
            queryClient.setQueryData(
                ['proposal-comments', proposalId],
                (old: CommentType[] = []) => [newComment, ...old]
            );
        }
    });
};

export const useDeleteComment = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ commentId, proposalId }: { commentId: string; proposalId: number }) => {
            await api.delete(`/proposals/comments/${commentId}`);
            return { commentId, proposalId };
        },
        onSuccess: ({ commentId, proposalId }) => {
            queryClient.setQueryData(
                ['proposal-comments', proposalId],
                (old: CommentType[] = []) => old.filter(comment => comment.id !== commentId)
            );
        }
    });
};

export const useProposalDocuments = (proposalId: number | undefined) => {
    const { api } = useAuth()!;
    
    return useQuery({
        queryKey: ['proposal-documents', proposalId],
        queryFn: async (): Promise<DocumentType[]> => {
            if (!proposalId) return [];
            const response = await api.get(`/proposals/${proposalId}/documents`);
            return response.data || [];
        },
        enabled: !!proposalId,
    });
};

export const useUploadDocument = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ proposalId, formData }: { proposalId: number; formData: FormData }) => {
            const response = await api.post(`/proposals/${proposalId}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        },
        onSuccess: (newDocument, { proposalId }) => {
            queryClient.setQueryData(
                ['proposal-documents', proposalId],
                (old: DocumentType[] = []) => [newDocument, ...old]
            );
        },
    });
};

export const useDeleteDocument = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ documentId, proposalId }: { documentId: string; proposalId: number }) => {
            await api.delete(`/proposals/documents/${documentId}`);
            return { documentId, proposalId };
        },
        onSuccess: ({ documentId, proposalId }) => {
            queryClient.setQueryData(
                ['proposal-documents', proposalId],
                (old: DocumentType[] = []) => old.filter(doc => doc.id !== documentId)
            );
        }
    });
};

export const useProposalCrossCommitteeRequests = (proposalId: number | undefined) => {
    const { api } = useAuth()!;
    
    return useQuery({
        queryKey: ['proposal-cross-committee-requests', proposalId],
        queryFn: async (): Promise<CrossCommitteeRequestType[]> => {
            if (!proposalId) return [];
            const response = await api.get(`/proposals/${proposalId}/cross-committee-requests`);
            return response.data || [];
        },
        enabled: !!proposalId,
    });
};

export const useCreateCrossCommitteeRequest = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ 
            proposalId, 
            data 
        }: { 
            proposalId: number; 
            data: { title: string; description: string; targetCommitteeId: number; }
        }) => {
            const response = await api.post(`/proposals/${proposalId}/cross-committee-requests`, data);
            return response.data;
        },
        onSuccess: (newRequest, { proposalId }) => {
        
            queryClient.setQueryData(
                ['proposal-cross-committee-requests', proposalId],
                (old: CrossCommitteeRequestType[] = []) => [newRequest, ...old]
            );
        
            queryClient.setQueryData(
                ['cross-committee-requests'],
                (old: CrossCommitteeRequestType[] = []) => [newRequest, ...old]
            );
        },
    });
};

export const useCrossCommitteeComments = (requestId: number | undefined) => {
    const { api } = useAuth()!;
    
    return useQuery({
        queryKey: ['cross-committee-comments', requestId],
        queryFn: async (): Promise<CommentType[]> => {
            if (!requestId) return [];
            const response = await api.get(`/proposals/cross-committee-requests/${requestId}/comments`);
            return response.data || [];
        },
        enabled: !!requestId,
    });
};

export const useAddCrossCommitteeComment = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ requestId, content }: { requestId: number; content: string }) => {
            const response = await api.post(`/proposals/cross-committee-requests/${requestId}/comments`, { content });
            return response.data;
        },
        onSuccess: (newComment, { requestId }) => {
            queryClient.setQueryData(
                ['cross-committee-comments', requestId],
                (old: CommentType[] = []) => [newComment, ...old]
            );
        },
    });
};

export const useDeleteCrossCommitteeComment = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ commentId, requestId }: { commentId: string; requestId: number }) => {
            await api.delete(`/proposals/cross-committee-requests/comments/${commentId}`);
            return { commentId, requestId };
        },
        onSuccess: ({ commentId, requestId }) => {
            queryClient.setQueryData(
                ['cross-committee-comments', requestId],
                (old: CommentType[] = []) => old.filter(comment => comment.id !== commentId)
            );
        },
    });
};

export const useCrossCommitteeDocuments = (requestId: number | undefined) => {
    const { api } = useAuth()!;
    
    return useQuery({
        queryKey: ['cross-committee-documents', requestId],
        queryFn: async (): Promise<DocumentType[]> => {
            if (!requestId) return [];
            const response = await api.get(`/proposals/cross-committee-requests/${requestId}/documents`);
            return response.data || [];
        },
        enabled: !!requestId,
    });
};

export const useUploadCrossCommitteeDocument = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ requestId, formData }: { requestId: number; formData: FormData }) => {
            const response = await api.post(`/proposals/cross-committee-requests/${requestId}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        },
        onSuccess: (newDocument, { requestId }) => {
            queryClient.setQueryData(
                ['cross-committee-documents', requestId],
                (old: DocumentType[] = []) => [newDocument, ...old]
            );
        },
    });
};

export const useDeleteCrossCommitteeDocument = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ documentId, requestId }: { documentId: string; requestId: number }) => {
            await api.delete(`/proposals/cross-committee-requests/documents/${documentId}`);
            return { documentId, requestId };
        },
        onSuccess: ({ documentId, requestId }) => {
            queryClient.setQueryData(
                ['cross-committee-documents', requestId],
                (old: DocumentType[] = []) => old.filter(doc => doc.id !== documentId)
            );
        },
    });
};