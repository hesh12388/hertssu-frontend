import { useAuth } from '@/App';
import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateMeetingPayload, MeetingType, Page, UpdateMeetingPayload } from '../types/meeting';

export const useUpcomingMeetings = (enabled: boolean = true) => {
    const { api } = useAuth()!;
    
    return useInfiniteQuery<Page<MeetingType>>({
        queryKey: ['upcoming-meetings'],
        queryFn: async ({ pageParam = 0 }) => {
            const response = await api.get(`/meetings/upcoming?page=${pageParam}&size=20`);
            return response.data;
        },
        getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.number + 1,
        initialPageParam: 0,
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};

export const usePastMeetings = (enabled: boolean = true) => {
    const { api } = useAuth()!;
    
    return useInfiniteQuery<Page<MeetingType>>({
        queryKey: ['past-meetings'],
        queryFn: async ({ pageParam = 0 }) => {
            const response = await api.get(`/meetings/history?page=${pageParam}&size=20`);
            return response.data;
        },
        getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.number + 1,
        initialPageParam: 0,
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateMeeting = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (data: CreateMeetingPayload) => {
            const response = await api.post('/meetings', data);
            return response.data;
        },
        onSuccess: (newMeeting) => {
            queryClient.setQueryData<InfiniteData<Page<MeetingType>>>(
                ['upcoming-meetings'],
                (old) => {
                    if (!old?.pages?.length) return old;
                    const [first, ...rest] = old.pages;
                    return {
                        ...old,
                        pages: [
                            { ...first, content: [newMeeting, ...(first.content || [])] },
                            ...rest,
                        ],
                    };
                }
            );
        },
    });
};

export const useUpdateMeeting = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ meetingId, data }: {
            meetingId: number;
            data: UpdateMeetingPayload;
        }) => {
            const response = await api.put(`/meetings/${meetingId}`, data);
            return response.data;
        },
        onSuccess: (updatedMeeting) => {
            // Update in upcoming meetings
            queryClient.setQueryData<InfiniteData<Page<MeetingType>>>(
                ['upcoming-meetings'],
                (old) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            content: page.content.map(m => 
                                m.meetingId === updatedMeeting.meetingId ? updatedMeeting : m
                            ),
                        })),
                    };
                }
            );
        },
    });
};

export const useDeleteMeeting = () => {
    const { api } = useAuth()!;
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ meetingId }: { meetingId: number }) => {
            await api.delete(`/meetings/${meetingId}`);
            return meetingId;
        },
        onSuccess: (deletedMeetingId) => {
            // Remove from upcoming meetings
            queryClient.setQueryData<InfiniteData<Page<MeetingType>>>(
                ['upcoming-meetings'],
                (old) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            content: page.content.filter(meeting => meeting.meetingId !== deletedMeetingId),
                        })),
                    };
                }
            );
        },
    });
};