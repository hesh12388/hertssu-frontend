import { useAuth } from '@/App';
import { useQuery } from '@tanstack/react-query';
import { AccountRequestDTO, UserType } from '../types/User';
export const useUsers = () => {
  const { api } = useAuth()!;
  
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UserType[]> => {
      const response = await api.get('/users');
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000, 
  });
};

export const useAccountRequests = () => {
  const { api } = useAuth()!;
  
  return useQuery({
    queryKey: ['accountRequests'],
    queryFn: async (): Promise<AccountRequestDTO[]> => {
      const response = await api.get('/users/account-requests');
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, 
  });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteUser = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ userId }: { userId: number }) => {
            await api.delete(`/users/${userId}`);
            return userId;
        },
        onSuccess: (deletedUserId) => {
            queryClient.setQueryData(['users'], (old: UserType[] = []) =>
                old.filter(user => user.id !== deletedUserId)
            );
        },
    });
};

export const useCreateUserFromRequest = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ request }: { request: AccountRequestDTO }) => {
            const createUserData = {
                email: request.email,
                password: "TempPassword123!",
                firstName: request.firstName,
                lastName: request.lastName,
                role: request.role,
                committeeId: request.committeeId,
                subcommitteeId: request.subcommitteeId || null,
                supervisorId: request.supervisorId ? request.supervisorId : undefined
            };
            
            const userResponse = await api.post('/users', createUserData);
            if (!userResponse || !userResponse.data) {
                throw new Error("Failed to create user from request");
            }
            
            // Delete account request
            await api.delete(`/users/account-requests/${request.id}`);
            
            return { newUser: userResponse.data, deletedRequestId: request.id };
        },
        onSuccess: ({ newUser, deletedRequestId }) => {
    
            queryClient.setQueryData(['users'], (old: UserType[] = []) => [newUser, ...old]);
            
      
            queryClient.setQueryData(['accountRequests'], (old: AccountRequestDTO[] = []) =>
                old.filter(request => request.id !== deletedRequestId)
            );
        },
    });
};

export const useRejectAccountRequest = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ requestId }: { requestId: number }) => {
            await api.delete(`/users/account-requests/${requestId}`);
            return requestId;
        },
        onSuccess: (deletedRequestId) => {
            queryClient.setQueryData(['accountRequests'], (old: AccountRequestDTO[] = []) =>
                old.filter(request => request.id !== deletedRequestId)
            );
        },
    });
};

export const useCreateUser = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (data: {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            role: string;
            committeeId: number;
            subcommitteeId: number | null;
            supervisorId?: number | null;
        }) => {
            const response = await api.post('/users', data);
            return response.data;
        },
        onSuccess: (newUser) => {
            queryClient.setQueryData(['users'], (old: UserType[] = []) => [newUser, ...old]);
        },
    });
};