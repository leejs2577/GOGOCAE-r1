'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, File, Trash2, AlertCircle, FileText, FileUp } from 'lucide-react';
import { RequestFile, FILE_TYPE_LABELS } from '@/domains/request/types';

interface FileListProps {
  requestId: string;
  files: RequestFile[];
  onFileDeleted?: (fileId: string) => void;
  canDelete?: boolean;
}

export default function FileList({
  requestId,
  files,
  onFileDeleted,
  canDelete = false
}: FileListProps) {
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 파일 타입별 아이콘 및 배지 색상 결정
  const getFileInfo = (file: RequestFile) => {
    const isReport = file.metadata?.type === 'report';
    
    if (isReport) {
      return {
        icon: <FileText className="h-5 w-5 text-blue-500" />,
        badge: <Badge variant="default" className="text-xs">보고서</Badge>,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    }
    
    return {
      icon: <File className="h-5 w-5 text-gray-400" />,
      badge: <Badge variant="outline" className="text-xs">{FILE_TYPE_LABELS[file.file_type as keyof typeof FILE_TYPE_LABELS] || file.file_type}</Badge>,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    };
  };

  const handleDownload = async (file: RequestFile) => {
    if (downloadingFiles.has(file.id)) return;

    setDownloadingFiles(prev => new Set(prev).add(file.id));

    try {
      const response = await fetch(`/api/requests/${requestId}/files/${file.id}/download`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '다운로드 URL 생성에 실패했습니다.');
      }

      const { downloadUrl, fileName } = await response.json();

      // 파일 다운로드
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert(`다운로드 중 오류가 발생했습니다: ${(error as Error).message}`);
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleDelete = async (file: RequestFile) => {
    if (!canDelete) return;
    
    if (!confirm(`"${file.file_name}" 파일을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/requests/${requestId}/files/${file.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '파일 삭제에 실패했습니다.');
      }

      onFileDeleted?.(file.id);
    } catch (error) {
      console.error('Delete error:', error);
      alert(`삭제 중 오류가 발생했습니다: ${(error as Error).message}`);
    }
  };

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">업로드된 파일이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="font-medium mb-3">첨부 파일 ({files.length})</h4>
        <div className="space-y-3">
          {files.map((file) => {
            const fileInfo = getFileInfo(file);
            const isReport = file.metadata?.type === 'report';
            
            return (
              <div key={file.id} className={`flex items-center justify-between p-3 ${fileInfo.bgColor} border ${fileInfo.borderColor} rounded-lg`}>
                <div className="flex items-center space-x-3">
                  {fileInfo.icon}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{file.file_name}</span>
                      {fileInfo.badge}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.file_size)} • {formatDate(file.uploaded_at)}
                    </div>
                    {isReport && file.metadata?.specialNotes && (
                      <div className="text-xs text-gray-600 mt-1 p-2 bg-white rounded border">
                        <strong>특이사항:</strong> {file.metadata.specialNotes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file)}
                    disabled={downloadingFiles.has(file.id)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {downloadingFiles.has(file.id) ? '다운로드 중...' : '다운로드'}
                  </Button>
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
