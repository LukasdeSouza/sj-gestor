import { Info, X, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpdateItem {
  title: string;
  description: string;
}

interface UpdatesBannerProps {
  version?: string;
  updates?: UpdateItem[];
  isActive?: boolean;
}

export default function UpdatesBanner({
  version = "1.0.0",
  updates = [],
  isActive = true,
}: UpdatesBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    // Verifica no localStorage se o usuário já fechou o aviso DESTA versão específica
    const seenVersion = localStorage.getItem("updates_seen_version");

    // Se estiver ativo e a versão salva for diferente da atual, mostra o banner
    if (isActive && seenVersion !== version) {
      setIsVisible(true);
    }
  }, [isActive, version]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Salva no navegador que o usuário já viu esta versão
    localStorage.setItem("updates_seen_version", version);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Banner Azul para Atualizações */}
      <div className="relative w-full bg-blue-600 dark:bg-blue-700 text-white px-4 py-3 shadow-md z-40">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              <span className="font-bold">Novidades da versão {version}:</span> Confira as atualizações do sistema.
            </p>
          </div>

          {updates.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs bg-white text-blue-600 hover:bg-blue-50 border-0"
              onClick={() => setDetailsOpen(true)}
            >
              Ver detalhes <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}

          <button
            onClick={handleDismiss}
            className="absolute right-2 top-2 sm:right-4 sm:top-1/2 sm:-translate-y-1/2 p-1 hover:bg-blue-700 rounded-full transition-colors"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Modal com detalhes das atualizações */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>O que há de novo na versão {version}</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Lista de melhorias e correções recentes.
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {updates.map((item, index) => (
              <div key={index} className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0 border-border">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {item.title}
                </h4>
                <p className="text-sm text-muted-foreground pl-3.5">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => { setDetailsOpen(false); handleDismiss(); }}>
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
