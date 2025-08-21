// src/hooks/useMeetingDetails.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosInstance } from "axios";
import {
    CreateMeetingPayload,
    MeetingResponseDto,
} from "../types/meeting";

export const meetingKeys = {
  detail: (id: number) => ["meeting", id] as const,
  allLists: ["meetings"] as const, // parent key for lists (upcoming/history/VM)
};

export function useMeetingDetails(
  api: AxiosInstance | null,
  meetingId: number | null,
  seed?: MeetingResponseDto
) {
  const client = useQueryClient();

  const query = useQuery<MeetingResponseDto>({
    queryKey: meetingId ? meetingKeys.detail(meetingId) : ["meeting", "null"],
    enabled: !!api && !!meetingId && !seed, // if we have a seed, skip fetching
    queryFn: async () => {
      const res = await api!.get<MeetingResponseDto>(`/meetings/${meetingId}`);
      return res.data;
    },
    // surface seed as initial data
    initialData: seed,
    // cache controls
    staleTime: seed ? Infinity : 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const updateMeeting = useMutation({
    mutationFn: async (payload: CreateMeetingPayload) => {
      const res = await api!.put<MeetingResponseDto>(`/meetings/${meetingId}`, payload);
      return res.data;
    },
    onSuccess: (updated) => {
      // 1) Write fresh detail into cache
      if (updated?.meetingId != null) {
        client.setQueryData(meetingKeys.detail(updated.meetingId), updated);
      } else if (meetingId != null) {
        client.setQueryData(meetingKeys.detail(meetingId), updated);
      }

      // 2) Invalidate any meetings lists (upcoming/history/VM) to re-derive rows
      client.invalidateQueries({ queryKey: meetingKeys.allLists });
    },
  });

  const deleteMeeting = useMutation({
    mutationFn: async () => {
      await api!.delete(`/meetings/${meetingId}`);
    },
    onSuccess: () => {
      // 1) Remove this detail query
      if (meetingId != null) {
        client.removeQueries({ queryKey: meetingKeys.detail(meetingId) });
      }
      // 2) Invalidate lists so the deleted row disappears
      client.invalidateQueries({ queryKey: meetingKeys.allLists });
    },
  });

  return {
    ...query,
    updateMeeting,
    deleteMeeting,
  };
}
