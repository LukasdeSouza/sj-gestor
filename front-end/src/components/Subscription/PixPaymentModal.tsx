import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import QRCode from "react-qr-code";

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
    navigator.clipboard.writeText("00020126430014br.gov.bcb.pix0121sjgestor116@gmail.com5204000053039865802BR592458.919.759 SAMANTHA MELG6009Sao Paulo62240520daqr30494131325710576304165B");
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
            <div className="bg-white p-4 rounded-lg border flex flex-col items-center justify-center min-h-[200px]">
              {pixQrCode.startsWith("data:image") ? (
                <img
                  src={pixQrCode}
                  alt="QR Code PIX"
                  className="w-full h-auto max-w-[200px]"
                />
              ) : (
                <QRCode
                  value={pixQrCode}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              )}
              <p className="text-xs text-muted-foreground mt-4">Escaneie com seu banco</p>
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
