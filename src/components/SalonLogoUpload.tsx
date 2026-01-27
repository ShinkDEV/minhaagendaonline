import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ImageCropper } from '@/components/ImageCropper';

interface SalonLogoUploadProps {
  logoUrl: string | null;
  salonName: string;
  onUploadSuccess: (url: string) => void;
}

export function SalonLogoUpload({ logoUrl, salonName, onUploadSuccess }: SalonLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleClick = () => {
    if (isAdmin && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Tipo de arquivo inválido',
        description: 'Use apenas JPG, PNG ou WebP',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5MB',
      });
      return;
    }

    // Convert to data URL and open cropper
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', croppedBlob, 'logo.jpg');

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://auzbynhwadrrgbtxdrbs.supabase.co'}/functions/v1/upload-salon-logo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer upload');
      }

      onUploadSuccess(result.url);
      toast({
        title: 'Logo atualizado',
        description: 'O logo do salão foi atualizado com sucesso',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer upload',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setUploading(false);
      setSelectedImage(null);
    }
  };

  const handleCropperClose = () => {
    setCropperOpen(false);
    setSelectedImage(null);
  };

  return (
    <>
      <div className="relative inline-block">
        <Avatar 
          className={`h-20 w-20 ${isAdmin ? 'cursor-pointer' : ''}`}
          onClick={handleClick}
        >
          <AvatarImage src={logoUrl || undefined} alt={salonName} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
            {getInitials(salonName)}
          </AvatarFallback>
        </Avatar>
        
        {isAdmin && (
          <>
            <div
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
              onClick={handleClick}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </>
        )}
      </div>

      {selectedImage && (
        <ImageCropper
          open={cropperOpen}
          onClose={handleCropperClose}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
    </>
  );
}
