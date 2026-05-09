import { useMutation } from '@tanstack/react-query';
import { aiAssignmentService, AiAssignmentRequest, AiRecommendation } from '@/services/aiAssignmentService';

export function useAiAssignment() {
  const mutation = useMutation({
    mutationFn: (request: AiAssignmentRequest) => aiAssignmentService.assignTask(request),
  });

  return {
    suggest:         mutation.mutate,
    recommendations: (mutation.data?.recomendaciones ?? []) as AiRecommendation[],
    isLoading:       mutation.isPending,
    isError:         mutation.isError,
    error:           mutation.error,
    reset:           mutation.reset,
  };
}
