import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixQrCode: string;
  pixKey: string;
  accountHolder: string;
  amount: number;
  planName: string;
  onPaymentConfirmed: () => void;
}

export default function PixPaymentModal({
  isOpen,
  onClose,
  pixQrCode,
  pixKey,
  accountHolder,
  amount,
  planName,
  onPaymentConfirmed,
}: PixPaymentModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedQrCode, setCopiedQrCode] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyQrCode = () => {
    navigator.clipboard.writeText(pixQrCode);
    setCopiedQrCode(true);
    setTimeout(() => setCopiedQrCode(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento PIX - {planName}</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie a chave PIX para fazer o pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Valor */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Valor a pagar</p>
            <p className="text-3xl font-bold">
              {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <p className="text-sm font-medium">QR Code PIX</p>
            <div className="bg-white p-4 rounded-lg border flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Escaneie com seu banco</p>
                <p className="text-xs font-mono break-all text-muted-foreground">{pixQrCode.substring(0, 50)}...</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyQrCode}
              className="w-full"
            >
              {copiedQrCode ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar QR Code
                </>
              )}
            </Button>
          </div>

          {/* Chave PIX */}
          {/* <div className="space-y-2">
            <p className="text-sm font-medium">Chave PIX</p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-mono break-all">{pixKey}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyKey}
              className="w-full"
            >
              {copiedKey ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Chave PIX
                </>
              )}
            </Button>
          </div> */}

          {/* Titular */}
          {/* <div className="space-y-2">
            <p className="text-sm font-medium">Titular da Conta</p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">{accountHolder}</p>
            </div>
          </div> */}

          {/* Instruções */}
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>IMPORTANTE:</strong> Após fazer o pagamento, você será solicitado a enviar o comprovante para confirmação.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={onPaymentConfirmed} className="flex-1">
              Já fiz o pagamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
