import { useAuth } from '@/App';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskCommentType, TaskDocumentType } from '../types/Task';
export const useTaskComments = (taskId: number | undefined) => {
    const { api } = useAuth()!;
    
    return useQuery({
        queryKey: ['task-comments', taskId],
        queryFn: async (): Promise<TaskCommentType[]> => {
            if (!taskId) return [];
            const response = await api.get(`/tasks/${taskId}/comments`);
            return response.data || [];
        },
        enabled: !!taskId,
    });
};

export const useAddTaskComment = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ taskId, content }: { taskId: number; content: string }) => {
            const response = await api.post(`/tasks/${taskId}/comments`, { content });
            return response.data;
        },
        onSuccess: (newComment, { taskId }) => {
            queryClient.setQueryData(
                ['task-comments', taskId],
                (old: TaskCommentType[] = []) => [newComment, ...old]
            );
        },
    });
};

export const useDeleteTaskComment = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ commentId, taskId }: { commentId: string; taskId: number; }) => {
            await api.delete(`/tasks/comments/${commentId}`);
            return { commentId, taskId };
        },
        onSuccess: ({ commentId, taskId }) => {
            queryClient.setQueryData(
                ['task-comments', taskId],
                (old: TaskCommentType[] = []) => old.filter(comment => comment.id !== commentId)
            );
        },
    });
};

export const useTaskDocuments = (taskId: number | undefined) => {
    const { api } = useAuth()!;
    
    return useQuery({
        queryKey: ['task-documents', taskId],
        queryFn: async (): Promise<TaskDocumentType[]> => {
            if (!taskId) return [];
            const response = await api.get(`/tasks/${taskId}/documents`);
            return response.data || [];
        },
        enabled: !!taskId,
    });
};

export const useUploadTaskDocument = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ taskId, formData }: { taskId: number; formData: FormData }) => {
            const response = await api.post(`/tasks/${taskId}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        },
        onSuccess: (newDocument, { taskId }) => {
            queryClient.setQueryData(
                ['task-documents', taskId],
                (old: TaskDocumentType[] = []) => [newDocument, ...old]
            );
        },
    });
};

export const useDeleteTaskDocument = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ documentId, taskId }: { documentId: string; taskId: number }) => {
            await api.delete(`/tasks/documents/${documentId}`);
            return { documentId, taskId };
        },
        onSuccess: ({ documentId, taskId }) => {
            queryClient.setQueryData(
                ['task-documents', taskId],
                (old: TaskDocumentType[] = []) => old.filter(doc => doc.id !== documentId)
            );
        },
    });
};