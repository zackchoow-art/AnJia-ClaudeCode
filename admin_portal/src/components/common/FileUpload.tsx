import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, X, Eye } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  file?: File; // Keep reference to original file
}

interface Props {
  projectId: string;
  type: 'planning' | 'design';
  onUploadComplete?: () => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_EXTENSIONS = ['.pdf', '.pptx', '.ppt'];

export default function FileUpload({ projectId, type, onUploadComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if file type is allowed
  const isAllowedFileType = (fileName: string): boolean => {
    return ALLOWED_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!isAllowedFileType(file.name)) {
        alert(`文件 ${file.name} 格式不支持。仅支持 PDF、PPTX 和 PPT 格式。`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`文件 ${file.name} 大小超过 100MB 限制。`);
        continue;
      }

      setUploading(true);

      try {
        // TODO: Call storage service upload
        // const { url, error } = await storageService.uploadFile(file, projectId, type);
        // For now, just add to list without uploading

        setUploadedFiles(prev => [
          ...prev,
          { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), name: file.name, size: file.size, file }
        ]);

        onUploadComplete?.();
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`文件 ${file.name} 上传失败`);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    await processFiles(e.dataTransfer.files);
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    await processFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-all cursor-pointer
          ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-outline-variant hover:border-primary hover:bg-surface/30'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.pptx,.ppt"
          onChange={handleChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-primary">
            <UploadCloud className="w-10 h-10 animate-spin" />
            <span className="font-medium">上传中...</span>
          </div>
        ) : (
          <>
            <div className="p-4 bg-primary/5 rounded-full">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            <p className="mt-3 text-sm font-medium text-on-surface">
              拖拽文件到这里或点击上传
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              支持 PDF、PPTX 格式，最大 100MB
            </p>
          </>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-on-surface">已上传文件 ({uploadedFiles.length})</h4>
          <div className="border border-outline-variant/30 rounded-lg overflow-hidden">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.id}-${index}`}
                className="flex items-center justify-between p-3 hover:bg-surface/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-on-surface">{file.name}</p>
                    <p className="text-xs text-on-surface-variant">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {}}
                    className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                    title="预览"
                    disabled={true}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
                    }}
                    className="p-1.5 text-on-surface-variant hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    title="删除"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
