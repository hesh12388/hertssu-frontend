import { useAuth } from '@/App';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CrossCommitteeRequestType, ProposalType } from '../types/Proposal';
export const useMyProposals = (enabled: boolean = true) => {
  const { api, user } = useAuth()!;
  
  return useQuery({
    queryKey: ['proposals', 'my'],
    queryFn: async (): Promise<ProposalType[]> => {
      const response = await api.get('/proposals/my-proposals');
      return response.data || [];
    },
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAllProposals = (enabled: boolean = true) => {
  const { api, user } = useAuth()!;
  
  return useQuery({
    queryKey: ['proposals', 'all'],
    queryFn: async (): Promise<ProposalType[]> => {
      const response = await api.get('/proposals/all');
      return response.data || [];
    },
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCrossCommitteeRequests = (enabled: boolean = true) => {
  const { api, user } = useAuth()!;
  
  return useQuery({
    queryKey: ['crossCommitteeRequests'],
    queryFn: async (): Promise<CrossCommitteeRequestType[]> => {
      const response = await api.get('/proposals/cross-committee-requests/for-my-committee');
      return response.data || [];
    },
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProposal = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ proposalId, data }: { 
            proposalId: number; 
            data: { title: string; description: string; dueDate: string; priority: string; }
        }) => {
            const response = await api.put(`/proposals/${proposalId}`, data);
            return response.data;
        },
        onSuccess: (updatedProposal) => {
            // Update all relevant caches
            queryClient.setQueryData(['my-proposals'], (old: ProposalType[] = []) =>
                old.map(p => p.id === updatedProposal.id ? updatedProposal : p)
            );
            queryClient.setQueryData(['all-proposals'], (old: ProposalType[] = []) =>
                old.map(p => p.id === updatedProposal.id ? updatedProposal : p)
            );
        },
    });
};

export const useUpdateProposalStatus = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ proposalId, status }: { proposalId: number; status: string }) => {
            const response = await api.patch(`/proposals/${proposalId}/status`, { status });
            return response.data;
        },
        onSuccess: (updatedProposal:ProposalType) => {
            // Update all relevant caches
            queryClient.setQueryData(['my-proposals'], (old: ProposalType[] = []) =>
                old.map(p => p.id === updatedProposal.id ? updatedProposal : p)
            );
            queryClient.setQueryData(['all-proposals'], (old: ProposalType[] = []) =>
                old.map(p => p.id === updatedProposal.id ? updatedProposal : p)
            );
            // update cross-committee requests if they reference this proposal
            queryClient.setQueryData(['cross-committee-requests'], (old: CrossCommitteeRequestType[] = []) =>
                old.map(r => r.proposalId === updatedProposal.id ? { ...r, status: updatedProposal.status } : r)
            );
        },
    });
};

export const useDeleteProposal = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ proposalId }: { proposalId: number }) => {
            await api.delete(`/proposals/${proposalId}`);
            return proposalId;
        },
        onSuccess: (deletedProposalId) => {
            // Remove from all relevant caches
            queryClient.setQueryData(['my-proposals'], (old: ProposalType[] = []) =>
                old.filter(p => p.id !== deletedProposalId)
            );
            queryClient.setQueryData(['all-proposals'], (old: ProposalType[] = []) =>
                old.filter(p => p.id !== deletedProposalId)
            );
            // remove related cross-committee requests
            queryClient.setQueryData(['cross-committee-requests'], (old: CrossCommitteeRequestType[] = []) =>
                old.filter(r => r.proposalId !== deletedProposalId)
            );
        },
    });
};

export const useCreateProposal = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (data: { title: string; description: string; dueDate: string; priority: string; assigneeId: number }) => {
            const response = await api.post('/proposals', data);
            return response.data;
        },
        onSuccess: (newProposal) => {
            queryClient.setQueryData(['my-proposals'], (old: ProposalType[] = []) => [newProposal, ...old]);
            queryClient.setQueryData(['all-proposals'], (old: ProposalType[] = []) => [newProposal, ...old]);
        },
    });
};