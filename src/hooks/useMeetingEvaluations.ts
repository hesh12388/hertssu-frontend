// src/hooks/useMeetingEvaluations.ts
import {
    CreateEvaluationPayload,
    EvaluationResponseDto,
    UpdateEvaluationPayload,
} from "@/src/types/meeting";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

const getUid = (e: any) =>
  e?.user?.id ?? e?.user?.userId ?? e?.userId ?? null;

export function useMeetingEvaluations(api: AxiosInstance | null, meetingId: number | null) {
  const qc = useQueryClient();

  const list = useQuery<EvaluationResponseDto[]>({
    queryKey: ["meetings", meetingId, "evaluations"],
    enabled: !!api && !!meetingId,
    queryFn: async () => {
      const res = await api!.get<EvaluationResponseDto[]>(`/meetings/evaluations/meeting/${meetingId}`);
      return res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Create evaluation
  const create = useMutation({
    mutationFn: async (payload: CreateEvaluationPayload) => {
      const res = await api!.post<EvaluationResponseDto>(`/meetings/evaluations`, payload);
      return res.data;
    },
    onSuccess: (created) => {
      qc.setQueryData(
        ["meetings", created.meetingId, "evaluations"],
        (old: EvaluationResponseDto[] = []) => {
          const cUid = getUid(created);
          const filtered = old.filter((e) => getUid(e) !== cUid);
          return [created, ...filtered];
        }
      );
    },
  });

  // Update evaluation
  const update = useMutation({
    mutationFn: async (args: { evaluationId: number; meetingId: number; body: UpdateEvaluationPayload }) => {
      const { evaluationId, body } = args;
      const res = await api!.put<EvaluationResponseDto>(`/meetings/evaluations/${evaluationId}`, body);
      return res.data;
    },
    onSuccess: (updated, { meetingId }) => {
      qc.setQueryData(
        ["meetings", meetingId, "evaluations"],
        (old: EvaluationResponseDto[] = []) =>
          old.map((e) => (e.evaluationId === updated.evaluationId ? updated : e))
      );
    },
  });

  // Delete evaluation
  const remove = useMutation({
    mutationFn: async (args: { meetingId: number; evaluationId: number }) => {
      await api!.delete(`/meetings/evaluations/${args.evaluationId}`);
      return args;
    },
    onSuccess: ({ evaluationId, meetingId }) => {
      qc.setQueryData(
        ["meetings", meetingId, "evaluations"],
        (old: EvaluationResponseDto[] = []) => old.filter((e) => e.evaluationId !== evaluationId)
      );
    },
  });

  return { ...list, create, update, remove };
}
