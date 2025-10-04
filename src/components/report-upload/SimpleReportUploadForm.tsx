'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import SimpleFileUpload from '@/components/file-upload/SimpleFileUpload';

const ReportUploadSchema = z.object({
  specialNotes: z.string().max(1000, '특이사항은 1000자 이하로 입력해주세요').optional(),
});

type ReportUploadData = z.infer<typeof ReportUploadSchema>;

interface SimpleReportUploadFormProps {
  requestId: string;
  onUploadComplete: () => void;
}

export default function SimpleReportUploadForm({ requestId, onUploadComplete }: SimpleReportUploadFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReportUploadData>({
    resolver: zodResolver(ReportUploadSchema),
    defaultValues: {
      specialNotes: '',
    },
  });

  const specialNotes = watch('specialNotes');

  const onSubmit = async (data: ReportUploadData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 파일이 업로드될 때 specialNotes가 함께 전달되므로
      // 여기서는 성공 메시지만 표시
      toast({
        title: "보고서 업로드 완료",
        description: "해석 보고서가 성공적으로 업로드되었습니다.",
      });
      
      reset();
      onUploadComplete();
    } catch (error) {
      console.error('Report upload error:', error);
      toast({
        title: "업로드 실패",
        description: "보고서 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUploadComplete = (fileId: string) => {
    // 파일 업로드 완료 시 폼 제출
    onSubmit({ specialNotes });
  };

  const handleFileUploadError = (error: string) => {
    toast({
      title: "파일 업로드 실패",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      {/* 특이사항 입력 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="specialNotes">특이사항</Label>
            <Textarea
              id="specialNotes"
              placeholder="해석 결과에 대한 특이사항이나 주의사항을 입력해주세요..."
              rows={4}
              {...register('specialNotes')}
              className={errors.specialNotes ? 'border-red-500' : ''}
            />
            {errors.specialNotes && (
              <p className="text-sm text-red-500">{errors.specialNotes.message}</p>
            )}
            <p className="text-xs text-gray-500">
              {specialNotes?.length || 0}/1000자
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 파일 업로드 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium">해석 보고서 파일</h3>
            </div>
            
            <SimpleFileUpload
              requestId={requestId}
              fileCategory="report"
              specialNotes={specialNotes}
              onUploadComplete={handleFileUploadComplete}
              onUploadError={handleFileUploadError}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* 제출 버튼 */}
      <div className="flex justify-end">
        <Button
          onClick={() => onSubmit({ specialNotes })}
          disabled={isSubmitting}
          className="min-w-32"
        >
          {isSubmitting ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              업로드 중...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              보고서 업로드
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

