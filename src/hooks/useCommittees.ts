import { useAuth } from '@/App';
import { useQuery } from '@tanstack/react-query';
import { CommitteeTypeWithSubcommittees } from '../types/User';

export const useCommittees = () => {
    const { api } = useAuth()!;
    
    return useQuery({
        queryKey: ['committees'],
        queryFn: async (): Promise<CommitteeTypeWithSubcommittees[]> => {
            const response = await api.get('/committees');
            return response.data || [];
        },
        staleTime: Infinity,
        gcTime: Infinity, 
    });
};