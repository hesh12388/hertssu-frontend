import { AxiosInstance } from "axios";
import type { CreateMeetingPayload, MeetingResponseDto } from "../types/meeting";

export const mapMeetingToPayload = (
  meeting: MeetingResponseDto
): CreateMeetingPayload => ({
  title: meeting.title,
  description: meeting.description ?? "",
  date: meeting.date,
  startTime: meeting.isAllDay ? "00:00" : meeting.startTime ?? "00:00",
  endTime: meeting.isAllDay ? "23:59" : meeting.endTime ?? "23:59",
  participants: meeting.participantEmails ?? [],
  location: meeting.location ?? "",
  recurrenceRule: meeting.recurrenceRule ?? undefined,
  isAllDay: meeting.isAllDay,
  reminders: meeting.reminders ?? [],
});


export type Note = {
  id: string;
  text: string;
  createdAt: string;
  author: string;
};

// service
export const addMeetingNote = async (
  api: AxiosInstance,
  meetingId: number,
  note: string
): Promise<Note> => {
  const res = await api.post(`/meetings/${meetingId}/notes`, { note });

  // map backend field `note` -> frontend field `text`
  return {
    id: res.data.id,
    text: res.data.note,
    createdAt: res.data.createdAt,
    author: res.data.author,
  };
};

export const updateMeetingNote = async (
  api: AxiosInstance,
  meetingId: number,
  noteId: string,
  note: string
): Promise<void> => {
  await api.put(`/meetings/${meetingId}/notes/${noteId}`, { note });
};

export const deleteMeetingNote = async (
  api: AxiosInstance,
  meetingId: number,
  noteId: string
): Promise<void> => {
  await api.delete(`/meetings/${meetingId}/notes/${noteId}`);
};

export const getMeetingNotes = async (
  api: AxiosInstance,
  meetingId: number
): Promise<Note[]> => {
  const res = await api.get(`/meetings/${meetingId}/notes`);
  return (res.data ?? []).map((n: any) => ({
    id: n.id,
    text: n.note, 
    createdAt: n.createdAt,
    author: n.author,
  }));
};

// ---------- PERFORMANCE EVALUATIONS ----------

export type MeetingEvaluationPayload = {
  participantId: number;            
  performance: number;
  communication: number;
  teamwork: number;
  notes?: string;
};

export const addMeetingEvaluation = async (
  api: AxiosInstance,
  meetingId: number,
  payload: MeetingEvaluationPayload
): Promise<void> => {
  await api.post(`/meetings/${meetingId}/evaluations`, payload);
};

export const updateMeetingEvaluation = async (
  api: AxiosInstance,
  meetingId: number,
  evaluationId: string,
  payload: MeetingEvaluationPayload
): Promise<void> => {
  await api.put(`/meetings/${meetingId}/evaluations/${evaluationId}`, payload);
};

export const deleteMeetingEvaluation = async (
  api: AxiosInstance,
  meetingId: number,
  evaluationId: string
): Promise<void> => {
  await api.delete(`/meetings/${meetingId}/evaluations/${evaluationId}`);
};

export const getMeetingEvaluations = async (
  api: AxiosInstance,
  meetingId: number
): Promise<any[]> => {
  const res = await api.get(`/meetings/${meetingId}/evaluations`);
  return res.data ?? [];
};

interface PaginatedMeetingsResponse {
  content: MeetingResponseDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const getMeetingsInRangeExpanded = async (
  api: AxiosInstance,
  from: string,
  to: string,
  offset: number = 0,
  limit: number = 15
): Promise<PaginatedMeetingsResponse> => {
  try {
    console.log(
      `[meetingServices] 🚀 Fetching EXPANDED meetings: from=${from}, to=${to}, offset=${offset}, limit=${limit}`
    );

    const startTime = performance.now();
    
    const response = await api.get<PaginatedMeetingsResponse>("/meetings/expanded-range", {
      params: {
        from,
        to,
        offset,
        limit,
      },
    });

    const duration = performance.now() - startTime;
    console.log(
      `[meetingServices] ✅ Fetched ${response.data?.content?.length || 0} expanded meetings in ${duration.toFixed(2)}ms`
    );
    return response.data;
  } catch (error) {
    console.error("[meetingServices] ❌ Error fetching expanded meetings in range:", error);
    throw error;
  }
};

export const getMeetingsInRange = async (
  api: AxiosInstance,
  from: string,
  to: string,
  offset: number = 0,
  limit: number = 15
): Promise<PaginatedMeetingsResponse> => {
  try {
    console.log(
      `[meetingServices] 🔎 Fetching meetings: from=${from}, to=${to}, offset=${offset}, limit=${limit}`
    );

  
    return await getMeetingsInRangeExpanded(api, from, to, offset, limit);
  } catch (error) {
    console.error("[meetingServices] ❌ Error fetching meetings in range:", error);
    throw error;
  }
};


export const createMeeting = async (api: AxiosInstance, meetingData: any) => {
  try {
    const response = await api.post("/meetings/create", meetingData, {
      headers: { "Content-Type": "application/json" },
      validateStatus: () => true, 
    });

    console.log("[meetingServices] ↩️ Raw response:", response.status, response.data);
    return response.data;
  } catch (error: any) {
    console.error("[meetingServices] ❌ Error creating meeting:", {
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};


/**
 * Update an existing meeting
 */
export const updateMeeting = async (api: AxiosInstance, meetingId: number, meetingData: any) => {
  try {
    console.log(`[meetingServices] 🔎 Updating meeting ${meetingId}:`, meetingData);
    
    const response = await api.put(`/meetings/update/${meetingId}`, meetingData);
    
    console.log("[meetingServices] ✅ Meeting updated successfully");
    return response.data;
  } catch (error) {
    console.error("[meetingServices] ❌ Error updating meeting:", error);
    throw error;
  }
};

/**
 * Delete a meeting (single or series)
 */
export const deleteMeeting = async (api: AxiosInstance, meetingId: number, options: any = {}) => {
  try {
    const { series = false, recurrenceId } = options;
    
    let endpoint = `/meetings/delete/${meetingId}`;
    
    if (series && recurrenceId) {
      // Delete entire series
      endpoint = `/meetings/delete/${recurrenceId}/all`;
      console.log(`[meetingServices] 🔎 Deleting meeting series: ${recurrenceId}`);
    } else {
      // Delete single meeting
      console.log(`[meetingServices] 🔎 Deleting single meeting: ${meetingId}`);
    }
    
    const response = await api.delete(endpoint);
    
    console.log("[meetingServices] ✅ Meeting deleted successfully");
    return response.data;
  } catch (error) {
    console.error("[meetingServices] ❌ Error deleting meeting:", error);
    throw error;
  }
};

/**
 * Get a single meeting by ID
 */
export const getMeetingById = async (api: AxiosInstance, meetingId: number) => {
  try {
    console.log(`[meetingServices] 🔎 Fetching meeting: ${meetingId}`);
    
    const response = await api.get(`/meetings/${meetingId}`);
    
    console.log("[meetingServices] ✅ Meeting fetched successfully");
    return response.data;
  } catch (error) {
    console.error("[meetingServices] ❌ Error fetching meeting:", error);
    throw error;
  }
};

/**
 * Get today's meetings with pagination
 */
export const getTodayMeetings = async (api: AxiosInstance, page: number = 0, size: number = 10) => {
  try {
    console.log(`[meetingServices] 🔎 Fetching today's meetings: page=${page}, size=${size}`);
    
    const response = await api.get("/meetings/today", {
      params: {
        page,
        size,
      },
    });
    
    console.log(`[meetingServices] ✅ Fetched ${response.data?.totalElements || 0} today's meetings`);
    return response.data;
  } catch (error) {
    console.error("[meetingServices] ❌ Error fetching today's meetings:", error);
    throw error;
  }
};


export const getUpcomingMeetings = async (api: AxiosInstance, offset: number = 0, limit: number = 10) => {
  try {
    console.log(`[meetingServices] 🔎 Fetching upcoming meetings: offset=${offset}, limit=${limit}`);
    
    const response = await api.get("/meetings/upcoming", {
      params: {
        offset,
        limit,
      },
    });
    
    console.log(`[meetingServices] ✅ Fetched ${response.data?.totalElements || 0} upcoming meetings`);
    return response.data;
  } catch (error) {
    console.error("[meetingServices] ❌ Error fetching upcoming meetings:", error);
    throw error;
  }
};


export const getHistoryMeetings = async (api: AxiosInstance, offset: number = 0, limit: number = 10) => {
  try {
    console.log(`[meetingServices] 🔎 Fetching meeting history: offset=${offset}, limit=${limit}`);
    
    const response = await api.get("/meetings/history", {
      params: {
        offset,
        limit,
      },
    });
    
    console.log(`[meetingServices] ✅ Fetched ${response.data?.totalElements || 0} history meetings`);
    return response.data;
  } catch (error) {
    console.error("[meetingServices] ❌ Error fetching meeting history:", error);
    throw error;
  }
};

export const getAllMeetings = async (api: AxiosInstance) => {
  try {
    console.log("[meetingServices] 🔎 Fetching all meetings");
    
    const response = await api.get("/meetings");
    
    console.log(`[meetingServices] ✅ Fetched ${response.data?.length || 0} meetings`);
    return response.data;
  } catch (error) {
    console.error("[meetingServices] ❌ Error fetching all meetings:", error);
    throw error;
  }
};

export const updateMeetingSeries = async (api: AxiosInstance, recurrenceId: string, meetingData: any) => {
  try {
    console.log(`[meetingServices] 🔎 Updating meeting series: ${recurrenceId}`, meetingData);
    
    const response = await api.put(`/meetings/update/series/${recurrenceId}`, meetingData);
    
    console.log("[meetingServices] ✅ Meeting series updated successfully");
    return response.data;
  } catch (error) {
    console.error("[meetingServices] ❌ Error updating meeting series:", error);
    throw error;
  }
};
