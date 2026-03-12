import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Home, Search, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-strong animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 rounded-xl bg-cobr-gradient flex items-center justify-center mb-6 hover-lift">
            <span className="text-white font-bold text-3xl">404</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Página não encontrada</h1>
          <p className="text-muted-foreground">
            Ops! A página que você está procurando não existe ou foi movida.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-cobr-50 border border-cobr-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-cobr-700 mb-2">
              <Search className="w-4 h-4" />
              <span className="font-medium">O que você pode fazer:</span>
            </div>
            <ul className="text-sm text-cobr-600 space-y-1">
              <li>• Verificar se o URL está correto</li>
              <li>• Voltar para a página anterior</li>
              <li>• Acessar o dashboard principal</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button 
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-cobr-600 hover:bg-cobr-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
