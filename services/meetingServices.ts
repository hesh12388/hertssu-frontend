import { AxiosInstance } from "axios";

export const getUpcomingMeetings = (api: AxiosInstance, size = 100) =>
  api.get(`/meetings/upcoming?size=${size}`);

export const getMeetingHistory = (api: AxiosInstance, size = 100) =>
  api.get(`/meetings/today?size=${size}`);

export const searchMeetings = (api: AxiosInstance, query: string, size = 100) =>
  api.get(`/meetings/search/title/${encodeURIComponent(query)}?size=${size}`);

export const getMeetingsInRange = (
  api: AxiosInstance,
  from: string,
  to: string,
  size = 100
) => api.get(`/meetings/range?from=${from}&to=${to}&size=${size}`);
