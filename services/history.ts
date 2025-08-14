import { AxiosInstance } from 'axios';

export const getUserMeetingsHistory = (api: AxiosInstance, page=0, size=20) =>
  api.get(`/progress/history/meetings/`, { params: { page, size, sort: 'date,desc' } });

export const getUserWarningsHistory = (api: AxiosInstance, page=0, size=20) =>
  api.get(`/progress/history/warnings/`, { params: { page, size, sort: 'loggedAt,desc' } });
