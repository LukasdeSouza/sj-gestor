import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SkeletonInformation from "@/components/Skeletons/SkeletonInformation";
import { PopupCreateProduct } from "@/components/Product/PopUpCreateProduct";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { PopupAlterProduct } from "@/components/Product/PopUpAlterProduct";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useMutation, useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { ProductsResponse } from "@/api/models/products";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AuthUser } from "@/api/models/auth";
import { toast } from "react-toastify";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Cookies from "js-cookie";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const limit = 10;
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["subscription", "me"],
    queryFn: async () => await fetchUseQuery<undefined, { 
      plan_id: string; 
      status: string; 
      pix_qr_code?: string;
      approved_at?: string;
    }>({ route: "/subscription/me", method: "GET" }),
    retry: 0,
  });

  const { data: dataProducts, isLoading: isloadingProducts, isFetching, refetch } = useQuery<ProductsResponse>({
    queryKey: ["listProducts", parsedUser.id, debouncedSearch, page, limit],
    queryFn: async () => {
      return await fetchUseQuery<{ user_id: string; name?: string; page: number; limit: number }, ProductsResponse>({
        route: "/products",
        method: "GET",
        data: { user_id: parsedUser.id, name: debouncedSearch || undefined, page, limit },
      });
    },
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!parsedUser.id,
  });
  const totalPages = useMemo(() => dataProducts?.totalPaginas ?? 1, [dataProducts]);
  const currentPage = useMemo(() => dataProducts?.pagina ?? page, [dataProducts, page]);

  const isPixSubscription = !!subscription?.pix_qr_code;
  const isApproved = !!subscription?.approved_at;
  const isPlanEffective = subscription?.status === 'ACTIVE' && (!isPixSubscription || isApproved);
  const effectivePlanId = isPlanEffective ? subscription?.plan_id : 'FREE';
  
  const productLimit = effectivePlanId === 'FREE' ? 5 : Infinity;
  const currentProductsCount = dataProducts?.resultados || 0;
  const canAddProduct = currentProductsCount < productLimit;

  const limitMessage = !isApproved && isPixSubscription && subscription?.status === 'ACTIVE'
    ? "Seu plano aguarda aprovação do pagamento para liberar mais produtos." 
    : "Limite de produtos atingido. Faça um upgrade para adicionar mais.";

  const { mutate: dataDelete, isPending: isloadingDataDelete } = useMutation({
    mutationFn: async (id: string) => {
      return await fetchUseQuery({
        route: `/products/${id}`,
        method: "DELETE",
      });
    },

    onSuccess: async () => {
      toast.success("Deletado com sucesso!");
      refetch();
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) {
        handleErrorMessages(error.errors);
      }
    }
  });

  if (isloadingProducts || isLoadingSubscription) {
    return <SkeletonInformation />
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">Gerencie seus produtos e serviços</p>
          </div>
          {canAddProduct ? (
            <PopupCreateProduct
              onSuccess={() => refetch()}
            />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="outline" className="opacity-50 cursor-not-allowed" onClick={() => toast.error(limitMessage)}>
                    Novo Produto
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-center">{limitMessage}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataProducts?.products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.description || "-"}</TableCell>
                    <TableCell>R$ {product.value.toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <PopupAlterProduct
                        id={product.id}
                        onSuccess={() => refetch()}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => dataDelete(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <div className="flex items-center justify-between px-6 pb-6">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isFetching}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isFetching}
              >
                Próxima
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
