import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface ClientAvatarUploadProps {
  clientId: string;
  clientName: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
};

const buttonSizeClasses = {
  sm: 'h-6 w-6 -bottom-0.5 -right-0.5',
  md: 'h-7 w-7 -bottom-1 -right-1',
  lg: 'h-8 w-8 -bottom-1 -right-1',
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const ClientAvatarUpload = ({
  clientId,
  clientName,
  avatarUrl,
  size = 'md',
  editable = false,
}: ClientAvatarUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Apenas imagens JPG, PNG ou WebP são permitidas');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', clientId);

      const { data, error } = await supabase.functions.invoke('upload-avatar', {
        body: formData,
      });

      if (error) throw error;

      toast.success('Foto atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erro ao enviar foto');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const displayUrl = previewUrl || avatarUrl;

  return (
    <div className="relative inline-block">
      <Avatar className={sizeClasses[size]}>
        {displayUrl ? (
          <AvatarImage src={displayUrl} alt={clientName} />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {getInitials(clientName)}
        </AvatarFallback>
      </Avatar>
      
      {editable && (
        <>
          <Button
            size="icon"
            variant="secondary"
            className={`absolute rounded-full ${buttonSizeClasses[size]}`}
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className={`${iconSizeClasses[size]} animate-spin`} />
            ) : (
              <Camera className={iconSizeClasses[size]} />
            )}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  );
};
