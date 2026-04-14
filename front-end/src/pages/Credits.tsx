import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CreditCard, 
  TrendingUp, 
  Zap, 
  Crown, 
  Rocket,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Star,
  Gift
} from "lucide-react";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { AuthUser } from "@/api/models/auth";
import Cookies from "js-cookie";
import DashboardLayout from "@/components/DashboardLayout";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  priceId: string;
  description: string;
  popular?: boolean;
}

interface Balance {
  balance: number;
  totalPurchased: number;
  totalConsumed: number;
  lastUpdated: string;
}

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'CONSUMPTION' | 'BONUS' | 'REFUND';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export default function Credits() {
  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carregar pacotes e saldo
  useEffect(() => {
    loadPackages();
    loadBalance();
    loadTransactions();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await fetchUseQuery<undefined, { packages: CreditPackage[] }>({
        route: '/credits/packages',
        method: 'GET'
      });
      if (response.packages) {
        setPackages(response.packages);
      }
    } catch (err) {
      console.error('Erro ao carregar pacotes:', err);
    }
  };

  const loadBalance = async () => {
    try {
      const response = await fetchUseQuery<undefined, { balance: Balance }>({
        route: '/credits/balance',
        method: 'GET'
      });
      if (response.balance) {
        setBalance(response.balance);
      }
    } catch (err) {
      console.error('Erro ao carregar saldo:', err);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await fetchUseQuery<undefined, { transactions: Transaction[] }>({
        route: '/credits/history?limit=10',
        method: 'GET'
      });
      if (response.transactions) {
        setTransactions(response.transactions);
      }
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetchUseQuery<{ packageId: string }, { checkoutUrl: string; sessionId: string }>({
        route: '/credits/checkout',
        method: 'POST',
        data: {
          packageId,
          successUrl: `${window.location.origin}/credits?success=true`,
          cancelUrl: `${window.location.origin}/credits?canceled=true`
        }
      });

      if (response.checkoutUrl) {
        // Redirecionar para o checkout do Stripe
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar compra');
      setPurchasing(null);
    }
  };

  // Verificar se houve sucesso ou cancelamento na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success === 'true') {
      setSuccess('Compra realizada com sucesso! Créditos adicionados à sua conta.');
      loadBalance();
      loadTransactions();
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled === 'true') {
      setError('Compra cancelada. Tente novamente quando desejar.');
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const getPackageIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'starter': return <Rocket className="w-6 h-6" />;
      case 'basic': return <Zap className="w-6 h-6" />;
      case 'pro': return <Crown className="w-6 h-6" />;
      case 'business': return <TrendingUp className="w-6 h-6" />;
      case 'ilimitado': return <Star className="w-6 h-6" />;
      default: return <CreditCard className="w-6 h-6" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'CONSUMPTION': return <Zap className="w-4 h-4 text-red-600" />;
      case 'BONUS': return <Gift className="w-4 h-4 text-purple-600" />;
      case 'REFUND': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default: return <CreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Meus Créditos</h1>
            <p className="text-muted-foreground">Gerencie seus créditos de disparo</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-12 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Meus Créditos</h1>
          <p className="text-muted-foreground">Gerencie seus créditos de disparo</p>
        </div>

        {/* Alertas */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Cards de Saldo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
                  <p className="text-2xl font-bold">{balance?.balance || 0}</p>
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Comprado</p>
                  <p className="text-2xl font-bold">{balance?.totalPurchased || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Consumido</p>
                  <p className="text-2xl font-bold">{balance?.totalConsumed || 0}</p>
                </div>
                <Zap className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Custo/Disparo</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <Gift className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pacotes de Créditos */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Comprar Créditos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={`relative ${pkg.popular ? 'border-blue-500 shadow-lg' : ''}`}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    {getPackageIcon(pkg.name)}
                  </div>
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                </CardHeader>
                
                <CardContent className="text-center space-y-4">
                  <div>
                    <div className="text-3xl font-bold">{pkg.credits}</div>
                    <div className="text-sm text-muted-foreground">créditos</div>
                  </div>
                  
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(pkg.price)}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(pkg.price / pkg.credits)} por crédito
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchasing === pkg.id}
                  >
                    {purchasing === pkg.id ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Comprar Agora
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Histórico de Transações */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Histórico de Transações</h2>
          <Card>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma transação encontrada</p>
                </div>
              ) : (
                <div className="divide-y">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Saldo: {transaction.balanceAfter}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
