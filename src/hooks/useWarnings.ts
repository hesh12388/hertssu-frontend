import { useAuth } from '@/App';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WarningResponse } from '../types/Warning';
import { usePermissions } from './usePermissions';
export const useWarnings = () => {
  const { api, user } = useAuth()!;
  const { isHigherLevel } = usePermissions(user || null);
  
  return useQuery({
    queryKey: ['warnings'],
    queryFn: async (): Promise<WarningResponse[]> => {
      const endpoint = isHigherLevel ? '/warnings' : '/warnings/my-warnings';
      const response = await api.get(endpoint);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useDeleteWarning = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ warningId }: { warningId: number }) => {
            await api.delete(`/warnings/${warningId}`);
            return warningId;
        },
        onSuccess: (deletedWarningId) => {
            queryClient.setQueryData(['warnings'], (old: WarningResponse[] = []) =>
                old.filter(warning => warning.id !== deletedWarningId)
            );
        },
    });
};

export const useCreateWarning = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (data: {
            assigneeId: number;
            reason: string;
            actionTaken: string | null;
            severity: string;
        }) => {
            const response = await api.post('/warnings', data);
            return response.data;
        },
        onSuccess: (newWarning) => {
            queryClient.setQueryData(['warnings'], (old: WarningResponse[] = []) => [newWarning, ...old]);
        },
    });
};