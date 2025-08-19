import { useAuth } from '@/App';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InterviewType } from '../types/Interview';

export const useInterviews = () => {
  const { api } = useAuth()!;
  
  return useQuery({
    queryKey: ['interviews'],
    queryFn: async (): Promise<InterviewType[]> => {
      const response = await api.get('/interviews');
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useDeleteInterview = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ interviewId }: { interviewId: string }) => {
            await api.delete(`/interviews/${interviewId}`);
            return interviewId;
        },
        onSuccess: (deletedInterviewId) => {
            queryClient.setQueryData(['interviews'], (old: InterviewType[] = []) =>
                old.filter(interview => interview.id !== deletedInterviewId)
            );
        },
    });
};

export const useCreateInterview = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (data: {
            name: string;
            gafEmail: string;
            phoneNumber?: string;
            gafId?: string;
            position: string;
            committeeId: number;
            subCommitteeId: number | null;
            startTime: string;
            endTime: string;
        }) => {
            const response = await api.post('/interviews', data);
            return response.data;
        },
        onSuccess: (newInterview) => {
            queryClient.setQueryData(['interviews'], (old: InterviewType[] = []) => [newInterview, ...old]);
        },
    });
};

export const useUpdateInterview = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ interviewId, data }: {
            interviewId: string;
            data: {
                name: string;
                gafEmail: string;
                phoneNumber?: string;
                gafId?: string;
                position: string;
                committeeId: number;
                subCommitteeId?: number;
                startTime: string;
                endTime: string;
            }
        }) => {
            const response = await api.put(`/interviews/${interviewId}`, data);
            return response.data;
        },
        onSuccess: (updatedInterview) => {
            queryClient.setQueryData(['interviews'], (old: InterviewType[] = []) =>
                old.map(interview => interview.id === updatedInterview.id ? updatedInterview : interview)
            );
        },
    });
};

export const useLogInterview = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ interviewId, data }: {
            interviewId: string;
            data: {
                performance: number;
                experience: number;
                communication: number;
                teamwork: number;
                confidence: number;
                accepted: boolean;
                notes?: string;
            }
        }) => {
            const response = await api.put(`/interviews/${interviewId}/log`, data);
            return response.data;
        },
        onSuccess: (updatedInterview) => {
            queryClient.setQueryData(['interviews'], (old: InterviewType[] = []) =>
                old.map(interview => interview.id === updatedInterview.id ? updatedInterview : interview)
            );
        },
    });
};