import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, File, X } from 'lucide-react';
import { toast } from 'react-toastify';

interface ProofUploadFormProps {
  subscriptionId: string;
  onUploadSuccess: (proofUrl: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProofUploadForm({
  subscriptionId,
  onUploadSuccess,
  onCancel,
  isLoading = false,
}: ProofUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use JPG, PNG ou PDF');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('proof', selectedFile);

      const apiUrl = import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:3020';
      const response = await fetch(`${apiUrl}/payments/${subscriptionId}/upload-proof`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao enviar comprovante');
      }

      toast.success('Comprovante enviado com sucesso!');
      onUploadSuccess(data.data?.proofUrl || '');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar comprovante');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          <strong>Envie o comprovante:</strong> Tire uma foto ou PDF do comprovante de pagamento PIX para confirmar seu pagamento.
        </p>
      </div>

      {/* File Input */}
      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileSelect}
          disabled={isUploading || isLoading}
          className="hidden"
          id="proof-file-input"
        />
        <label htmlFor="proof-file-input" className="cursor-pointer">
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Clique para selecionar ou arraste um arquivo</p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou PDF (máx. 5MB)</p>
        </label>
      </div>

      {/* Preview */}
      {selectedFile && (
        <div className="space-y-2">
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
              <button
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <File className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isUploading || isLoading} className="flex-1">
          Cancelar
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || isLoading}
          className="flex-1"
        >
          {isUploading ? 'Enviando...' : 'Enviar Comprovante'}
        </Button>
      </div>
    </div>
  );
}
