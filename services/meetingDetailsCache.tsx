// src/services/meetingDetailsCache.ts
import type { AxiosInstance } from "axios";
import type { MeetingResponseDto } from "../types/meeting";
import { getMeetingById } from "./meetingServices";

const meetingCache = new Map<number, MeetingResponseDto>();

export function primeMeetingCache(meeting: MeetingResponseDto) {
  meetingCache.set(meeting.meetingId, meeting);
}

export function getCachedMeeting(id: number) {
  return meetingCache.get(id) || null;
}

/**
 * Stale-while-revalidate fetch.
 * - Immediately returns cached (or seed) via setState
 * - Then fetches fresh and updates cache + state
 */
export async function fetchMeetingSWRCached(
  api: AxiosInstance,
  id: number,
  onData: (m: MeetingResponseDto) => void,
  seed?: Partial<MeetingResponseDto>
) {
  // 1) seed
  if (seed) {
    const seeded: MeetingResponseDto = {
      meetingId: id,
      title: seed.title ?? "",
      description: seed.description ?? null,
      location: seed.location ?? null,
      date: seed.date ?? new Date().toISOString().slice(0, 10),
      startTime: seed.startTime ?? null,
      endTime: seed.endTime ?? null,
      isAllDay: !!seed.isAllDay,
      participantEmails: seed.participantEmails ?? [],
      recurrenceRule: seed.recurrenceRule ?? null,
      recurrenceId: seed.recurrenceId ?? null,
      recurrenceUntil: seed.recurrenceUntil ?? null,
      reminders: seed.reminders ?? [],
      meetingStatus: seed.meetingStatus ?? null,
      createdAt: seed.createdAt ?? null,
      updatedAt: seed.updatedAt ?? null,
      zoomMeetingId: seed.zoomMeetingId ?? null,
      joinUrl: seed.joinUrl ?? null,
    };
    onData(seeded);
  }

  // 2) cached
  const cached = getCachedMeeting(id);
  if (cached && !seed) onData(cached);

  // 3) revalidate
  const fresh = await getMeetingById(api, id);
  if (fresh) {
    meetingCache.set(id, fresh);
    onData(fresh);
  }
}
