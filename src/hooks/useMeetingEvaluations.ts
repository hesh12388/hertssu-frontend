import { useAuth } from '@/App';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateEvaluationPayload, EvaluationType, UpdateEvaluationPayload } from '../types/meeting';
export const useMeetingEvaluations = (meetingId: number | undefined) => {
    const { api } = useAuth()!;
    
    return useQuery({
        queryKey: ['meeting-evaluations', meetingId],
        queryFn: async (): Promise<EvaluationType[]> => {
            if (!meetingId) return [];
            const response = await api.get(`/meetings/evaluations/meeting/${meetingId}`);
            return response.data || [];
        },
        enabled: !!meetingId,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateEvaluation = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (data: CreateEvaluationPayload) => {
            const response = await api.post('/meetings/evaluations', data);
            return response.data;
        },
        onSuccess: (newEvaluation) => {
            queryClient.setQueryData(
                ['meeting-evaluations', newEvaluation.meetingId],
                (old: EvaluationType[] = []) => {
                    const filtered = old.filter(e => e.user.userId !== newEvaluation.user.userId);
                    return [newEvaluation, ...filtered];
                }
            );
        },
    });
};

export const useUpdateEvaluation = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ evaluationId, meetingId, data }: {
            evaluationId: number;
            meetingId: number;
            data: UpdateEvaluationPayload;
        }) => {
            const response = await api.put(`/meetings/evaluations/${evaluationId}`, data);
            return { ...response.data, meetingId };
        },
        onSuccess: (updatedEvaluation) => {
            queryClient.setQueryData(
                ['meeting-evaluations', updatedEvaluation.meetingId],
                (old: EvaluationType[] = []) =>
                    old.map(e => e.evaluationId === updatedEvaluation.evaluationId ? updatedEvaluation : e)
            );
        },
    });
};