// src/hooks/useMeetings.ts
import {
  InfiniteData,
  QueryFunctionContext,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosInstance } from "axios";
import { useCallback, useMemo } from "react";
import { Alert, Linking } from "react-native";
import {
  CreateMeetingPayload,
  MeetingResponseDto,
  Page,
} from "../types/meeting";

/* -------------------------- Fetchers -------------------------- */

export const fetchUpcomingMeetings =
  (api: AxiosInstance) =>
  async ({ pageParam = 0 }: QueryFunctionContext): Promise<Page<MeetingResponseDto>> => {
    const res = await api.get<Page<MeetingResponseDto>>(
      `/meetings/upcoming?page=${pageParam}&size=10`
    );
    return res.data;
  };

export const fetchMeetingHistory =
  (api: AxiosInstance) =>
  async ({ pageParam = 0 }: QueryFunctionContext): Promise<Page<MeetingResponseDto>> => {
    const res = await api.get<Page<MeetingResponseDto>>(
      `/meetings/history?page=${pageParam}&size=10`
    );
    return res.data;
  };

/* -------------------------- Queries --------------------------- */

export const useUpcomingMeetings = (api: AxiosInstance, isEnabled: boolean) => {
  return useInfiniteQuery<Page<MeetingResponseDto>>({
    queryKey: ["meetings", "upcoming"],
    queryFn: fetchUpcomingMeetings(api),
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    initialPageParam: 0,
    enabled: isEnabled,

    // tuning
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useMeetingHistory = (api: AxiosInstance, isEnabled: boolean) => {
  return useInfiniteQuery<Page<MeetingResponseDto>>({
    queryKey: ["meetings", "history"],
    queryFn: fetchMeetingHistory(api),
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    initialPageParam: 0,
    enabled: isEnabled,

    // tuning
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

/* ------------------------- Mutations -------------------------- */

export const deleteMeetingApi =
  (api: AxiosInstance) =>
  async (meetingId: number): Promise<void> => {
    await api.delete(`/meetings/${meetingId}`);
  };

export const useDeleteMeeting = (api: AxiosInstance) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMeetingApi(api),
    onSuccess: (_, meetingId) => {
      // Update upcoming meetings list locally
      queryClient.setQueryData<InfiniteData<Page<MeetingResponseDto>>>(
        ["meetings", "upcoming"],
        (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              content: page.content.filter(
                (meeting) => meeting.meetingId !== meetingId
              ),
            })),
          };
        }
      );

      // History might change too
      queryClient.invalidateQueries({ queryKey: ["meetings", "history"] });
    },
    onError: (error) => {
      console.error("Delete meeting failed:", error);
    },

    gcTime: 30 * 60 * 1000,
    networkMode: "online",
  });
};

export const useCreateMeeting = (api: AxiosInstance) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMeetingPayload) => {
      const res = await api.post<MeetingResponseDto>("/meetings", payload);
      console.log(res, "res");
      return res.data;
    },

    onSuccess: (newMeeting) => {
      // Optimistically prepend to the first upcoming page if it exists
      queryClient.setQueryData<InfiniteData<Page<MeetingResponseDto>>>(
        ["meetings", "upcoming"],
        (old) => {
          if (!old?.pages?.length) return old; // nothing to patch yet
          const [first, ...rest] = old.pages;
          return {
            ...old,
            pages: [
              { ...first, content: [newMeeting, ...(first.content ?? [])] },
              ...rest,
            ],
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },

    gcTime: 30 * 60 * 1000,
    networkMode: "online",
  });
};


/* ----------------------- View Model hook ---------------------- */

export type TabKey = "upcoming" | "history";
export type Section = { title: string; data: MeetingResponseDto[] };

const toSections = (
  pages: Page<MeetingResponseDto>[] | undefined,
  q: string
): Section[] => {
  if (!pages) return [];
  const all = pages.flatMap((p) => p.content);
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? all.filter(
        (m) =>
          m.title.toLowerCase().includes(needle) ||
          (m.location?.toLowerCase?.().includes(needle) ?? false)
      )
    : all;

  const byDate: Record<string, MeetingResponseDto[]> = {};
  for (const m of filtered) {
    if (!byDate[m.date]) byDate[m.date] = [];
    byDate[m.date].push(m);
  }

  return Object.entries(byDate)
    .map(([date, data]) => ({
      title: date,
      data: data.sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
};

export function useMeetingsVM({
  api,
  tab,
  search,
  onOpenDetails,
}: {
  api: AxiosInstance;
  tab: TabKey;
  search: string;
  onOpenDetails?: (meetingId: number) => void;
}) {
  const upcoming = useUpcomingMeetings(api, tab === "upcoming");
  const history = useMeetingHistory(api, tab === "history");
  const active = tab === "upcoming" ? upcoming : history;

  // sections derived from active pages + search
  const sections = useMemo(
    () => toSections(active.data?.pages, search),
    [active.data?.pages, search]
  );

  // delete
  const del = useDeleteMeeting(api);
  const onDeleteItem = useCallback(
    (m: MeetingResponseDto) => {
      Alert.alert(
        "Delete meeting",
        "Are you sure you want to delete this meeting?",
        [
          { text: "Delete", style: "destructive", onPress: () => del.mutate(m.meetingId) },
          { text: "Cancel", style: "cancel" },
        ]
      );
    },
    [del]
  );

  // join
  const onJoinItem = useCallback((m: MeetingResponseDto) => {
    if (!m.joinUrl) return;
    Linking.openURL(m.joinUrl).catch((e) =>
      console.error("Open URL failed", e)
    );
  }, []);

  // open details
  const onPressItem = useCallback(
    (m: MeetingResponseDto) => {
      if (onOpenDetails) onOpenDetails(m.meetingId);
      else console.log("Open details for", m.meetingId);
    },
    [onOpenDetails]
  );

  // pagination and refresh
  const onRefresh = useCallback(() => {
    active.refetch();
  }, [active.refetch]);

  const onEndReached = useCallback(() => {
    if (active.hasNextPage && !active.isFetchingNextPage) {
      active.fetchNextPage();
    }
  }, [active.hasNextPage, active.isFetchingNextPage]);

  // status message similar to useMeetingDetails
  let statusMessage: string | null = null;
  if (active.isLoading && (active.data?.pages?.length ?? 0) === 0) {
    statusMessage = "Loading meetings...";
  } else if (active.isError) {
    statusMessage = "Failed to load meetings.";
  } else if (!sections.length) {
    statusMessage = search
      ? "No meetings found."
      : `No ${tab === "history" ? "past" : "upcoming"} meetings.`;
  }

  return {
    // data
    sections,

    // status flags
    isLoadingInitial:
      active.isLoading && (active.data?.pages?.length ?? 0) === 0,
    isRefreshing: active.isRefetching && !active.isFetchingNextPage,
    isFetchingMore: active.isFetchingNextPage,

    // handlers
    onRefresh,
    onEndReached,
    onPressItem,
    onDeleteItem,
    onJoinItem,

    // message
    statusMessage,
  };
}
