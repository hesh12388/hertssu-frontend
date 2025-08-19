import { useAuth } from '@/App';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskType } from '../types/Task';

export const useMyTasks = (enabled: boolean = true) => {
    const { api } = useAuth()!;
    
    return useQuery({
        queryKey: ['my-tasks'],
        queryFn: async (): Promise<TaskType[]> => {
            const response = await api.get('/tasks/assigned-to-me');
            return response.data || [];
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};

export const useAssignedByMeTasks = (enabled: boolean = true) => {
    const { api } = useAuth()!;
    
    return useQuery({
        queryKey: ['assigned-by-me-tasks'],
        queryFn: async (): Promise<TaskType[]> => {
            const response = await api.get('/tasks/assigned-by-me');
            return response.data || [];
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};

export const useDeleteTask = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ taskId }: { taskId: number }) => {
            await api.delete(`/tasks/${taskId}`);
            return taskId;
        },
        onSuccess: (deletedTaskId) => {
            queryClient.setQueryData(['my-tasks'], (old: TaskType[] = []) =>
                old.filter(task => task.id !== deletedTaskId)
            );
        },
    });
};

export const useCreateTask = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (data: {
            title: string;
            description: string;
            assigneeId: number;
            dueDate: string;
            priority: string;
        }) => {
            const response = await api.post('/tasks', data);
            return response.data;
        },
        onSuccess: (newTask) => {
          
            queryClient.setQueryData(['assigned-by-me-tasks'], (old: TaskType[] = []) => [newTask, ...old]);
        },
    });
};

export const useUpdateTask = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ taskId, data }: {
            taskId: number;
            data: { title: string; description: string; dueDate: string; priority: string; }
        }) => {
            const response = await api.put(`/tasks/${taskId}`, data);
            return response.data;
        },
        onSuccess: (updatedTask) => {
            queryClient.setQueryData(['assigned-by-me-tasks'], (old: TaskType[] = []) =>
                old.map(t => t.id === updatedTask.id ? updatedTask : t)
            );
        }
    });
};

export const useUpdateTaskStatus = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
            const response = await api.patch(`/tasks/${taskId}/status`, { status });
            return response.data;
        },
        onSuccess: (updatedTask) => {
            queryClient.setQueryData(['my-tasks'], (old: TaskType[] = []) =>
                old.map(t => t.id === updatedTask.id ? updatedTask : t)
            );
            queryClient.setQueryData(['assigned-by-me-tasks'], (old: TaskType[] = []) =>
                old.map(t => t.id === updatedTask.id ? updatedTask : t)
            );
        },
    });
};