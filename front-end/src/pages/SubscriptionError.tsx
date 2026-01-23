import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubscriptionError() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Opcional: você pode inspecionar os params de erro aqui
    // const params = new URLSearchParams(location.search);
  }, [location.search]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-semibold">Pagamento não concluído</h1>
        <p className="text-muted-foreground">
          Não foi possível concluir o pagamento. Você pode tentar novamente.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate("/plans")}>Voltar aos planos</Button>
          <Button onClick={() => navigate("/dashboard")}>Ir ao dashboard</Button>
        </div>
      </div>
    </div>
  );
}

