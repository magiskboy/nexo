import { useState, useEffect, useMemo, memo } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { setImagePreviewOpen } from '@/features/ui/state/uiSlice';
import {
  FileText,
  FileVideo,
  FileAudio,
  FileImage,
  File as FileIcon,
} from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface AttachedFileItemProps {
  file: File;
  onRemove: (index: number) => void;
  index: number;
  disabled: boolean;
}

export const AttachedFileItem = memo(
  ({ file, onRemove, index, disabled }: AttachedFileItemProps) => {
    const dispatch = useAppDispatch();

    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const isImage = file.type.startsWith('image/');

    useEffect(() => {
      let url: string | null = null;
      if (isImage) {
        url = URL.createObjectURL(file);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setObjectUrl(url);
      }

      return () => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      };
    }, [file, isImage]);

    const fileInfo = useMemo(() => {
      const mimeType = file.type;

      let Icon;
      let typeLabel;

      if (mimeType.startsWith('image/')) {
        Icon = FileImage;
        typeLabel = 'Image';
      } else if (mimeType.startsWith('video/')) {
        Icon = FileVideo;
        typeLabel = 'Video';
      } else if (mimeType.startsWith('audio/')) {
        Icon = FileAudio;
        typeLabel = 'Audio';
      } else if (
        mimeType === 'application/pdf' ||
        mimeType.startsWith('text/')
      ) {
        Icon = FileText;
        typeLabel = mimeType === 'application/pdf' ? 'PDF' : 'Text';
      } else {
        Icon = FileIcon;
        typeLabel = 'File';
      }

      return { Icon, typeLabel };
    }, [file.type]);

    return (
      <div className="relative group">
        {isImage ? (
          <div
            className="relative h-16 w-16 overflow-hidden rounded-md border border-border cursor-pointer hover:opacity-80 transition-opacity bg-black/5 dark:bg-white/5 flex items-center justify-center"
            onClick={(e) => {
              if (objectUrl) {
                e.stopPropagation();
                dispatch(setImagePreviewOpen({ open: true, url: objectUrl }));
              }
            }}
          >
            {objectUrl ? (
              <img
                src={objectUrl}
                alt={file.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <FileImage className="h-6 w-6 text-muted-foreground opacity-50" />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs min-w-[180px] max-w-[220px]">
            <fileInfo.Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="truncate font-medium">{file.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {fileInfo.typeLabel} • {formatFileSize(file.size)}
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          disabled={disabled}
        >
          ×
        </button>
      </div>
    );
  }
);

AttachedFileItem.displayName = 'AttachedFileItem';
