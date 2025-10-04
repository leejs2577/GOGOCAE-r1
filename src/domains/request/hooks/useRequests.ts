'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getRequests,
  createRequest,
  updateRequest,
  deleteRequest,
} from '../services/requestService';
import type { Request, CreateRequestData, UpdateRequestData } from '../types';

export const useRequests = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: requests = [],
    isLoading,
    error,
  } = useQuery<Request[], Error>({
    queryKey: ['requests'],
    queryFn: async () => {
      const { requests, error } = await getRequests();
      if (error) {
        throw new Error(error);
      }
      return requests;
    },
  });

  const createMutation = useMutation<any, Error, CreateRequestData>({
    mutationFn: createRequest,
    onSuccess: (data) => {
      if (data.error) {
        toast({
          variant: 'destructive',
          title: '요청 생성 실패',
          description: data.error,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['requests'] });
        toast({
          title: '요청 생성 성공',
          description: '새로운 해석 요청이 생성되었습니다.',
        });
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: '요청 생성 오류',
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation<any, Error, { id: string; data: UpdateRequestData }>({
    mutationFn: ({ id, data }) => updateRequest(id, data),
    onSuccess: (data) => {
      if (data.error) {
        toast({
          variant: 'destructive',
          title: '요청 업데이트 실패',
          description: data.error,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['requests'] });
        toast({
          title: '요청 업데이트 성공',
          description: '요청이 업데이트되었습니다.',
        });
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: '요청 업데이트 오류',
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation<any, Error, string>({
    mutationFn: deleteRequest,
    onSuccess: (data) => {
      if (data.error) {
        toast({
          variant: 'destructive',
          title: '요청 삭제 실패',
          description: data.error,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['requests'] });
        toast({
          title: '요청 삭제 성공',
          description: '요청이 삭제되었습니다.',
        });
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: '요청 삭제 오류',
        description: error.message,
      });
    },
  });

  return {
    requests,
    isLoading,
    error,
    createRequest: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateRequest: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteRequest: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

