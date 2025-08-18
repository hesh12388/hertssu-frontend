// hooks/useUserProfile.ts
import { useAuth } from '@/App';
import { useQuery } from '@tanstack/react-query';

import { UserProfileResponse } from '../types/Profile';
// Custom hook for fetching user profiles
export const useUserProfile = (userId: number | null, enabled: boolean = true) => {
  const { api } = useAuth()!;

  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async (): Promise<UserProfileResponse> => {
      if (!userId) throw new Error('User ID is required');
      
      const response = await api.get(`/users/${userId}/profile`);
      return response.data;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,   
    gcTime: 15 * 60 * 1000,    
  });
};
