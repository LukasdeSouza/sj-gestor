import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface MaintenanceBannerProps {
    message?: string;
    isActive?: boolean;
}

export default function MaintenanceBanner({
    message = "O sistema está passando por uma manutenção programada. Provavelmente será necessário reconectar o Whatsapp na aba Whatsapp, confira se a conexão está ativa.",
    isActive = false,
}: MaintenanceBannerProps) {
    const [isVisible, setIsVisible] = useState(isActive);

    if (!isVisible) return null;

    return (
        <div className="relative w-full bg-red-600 text-white px-4 py-3 shadow-md z-50">
            <div className="container mx-auto flex items-center justify-center gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium text-center">{message}</p>
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-red-700 rounded-full transition-colors"
                    aria-label="Fechar aviso"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
