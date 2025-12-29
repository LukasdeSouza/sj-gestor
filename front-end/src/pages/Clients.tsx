import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PopUpRegisterPayment } from "@/components/Client/PopUpRegisterPayment";
import SkeletonInformation from "@/components/Skeletons/SkeletonInformation";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { PopupCreateClient } from "@/components/Client/PopUpCreateClient";
import { PopupAlterClient } from "@/components/Client/PopUpAlterClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { Client, ClientsResponse } from "@/api/models/clients";
import { useMutation, useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Separator } from "@/components/ui/separator";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPhoneNumber } from "@/utils/mask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search } from "lucide-react";
import { AuthUser } from "@/api/models/auth";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const paymentsLimit = 10;

  // Sempre que o termo de busca mudar, volte para a primeira página
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const { data: dataClients, isLoading: isloadingClients, isFetching, refetch } = useQuery<ClientsResponse>({
    queryKey: ["listClients", parsedUser.id, debouncedSearch, page, limit],
    queryFn: async () => {
      return await fetchUseQuery<{ user_id: string; name?: string; page: number; limit: number }, ClientsResponse>({
        route: "/clients",
        method: "GET",
        data: { user_id: parsedUser.id, name: debouncedSearch || undefined, page, limit },
      });
    },
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!parsedUser.id,
  });

  const totalPages = useMemo(() => dataClients?.totalPaginas ?? 1, [dataClients]);
  const currentPage = useMemo(() => dataClients?.pagina ?? page, [dataClients, page]);

  // Pagamentos do cliente selecionado
  type ClientPaymentsResponse = {
    payments: { id: string; paid_at: string; amount?: number | null; note?: string | null }[];
    pagina: number; totalPaginas: number; limite: number; resultados: number;
  };

  const { data: dataPayments, isFetching: isFetchingPayments, refetch: refetchPayments } = useQuery<ClientPaymentsResponse>({
    queryKey: ["clientPayments", selectedClient?.id, paymentsPage, paymentsLimit],
    queryFn: async () => {
      return await fetchUseQuery<undefined, ClientPaymentsResponse>({
        route: `/clients/${selectedClient?.id}/payments?page=${paymentsPage}&limit=${paymentsLimit}`,
        method: "GET",
      });
    },
    enabled: viewOpen && !!selectedClient?.id,
    refetchOnWindowFocus: false,
  });

  const { mutate: mutateDelete, isPending: isloadingmutateDelete } = useMutation({
    mutationFn: async (id: string) => {
      return await fetchUseQuery({
        route: `/clients/${id}`,
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

  const { mutate: mutateDeletePayment, isPending: isloadingmutateDeletePayment } = useMutation({
    mutationFn: async (id: string) => {
      return await fetchUseQuery({
        route: `/clients/payments/${id}`,
        method: "DELETE",
      });
    },

    onSuccess: async () => {
      toast.success("Pagamento deletado com sucesso!");
      await Promise.allSettled([refetchPayments(), refetch()]);
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) {
        handleErrorMessages(error.errors);
      }
    }
  });

  if (isloadingClients) {
    return <SkeletonInformation />
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">Gerencie seus clientes</p>
          </div>
          <PopupCreateClient
            onSuccess={() => refetch()}
          />
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataClients?.clients?.map((client) => (
                  <TableRow
                    key={client.id}
                    className="hover:bg-accent/40 cursor-pointer"
                    onClick={() => { setSelectedClient(client); setViewOpen(true); setPaymentsPage(1); }}
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{formatPhoneNumber(client.phone)}</TableCell>
                    <TableCell>
                      {client.due_at ? new Date(client.due_at as any).toLocaleString("pt-BR") : "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <PopUpRegisterPayment id={client.id} onSuccess={() => { refetchPayments(); refetch(); }} />
                      <PopupAlterClient
                        id={client.id}
                        onSuccess={() => refetch()}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => mutateDelete(client.id)}
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

        {/* Visualização rápida do cliente + histórico */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do cliente</DialogTitle>
            </DialogHeader>

            {selectedClient && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedClient.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium">{formatPhoneNumber(selectedClient.phone)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="font-medium">{selectedClient.email ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vencimento</p>
                    <p className="font-medium">{selectedClient.due_at ? new Date(selectedClient.due_at as any).toLocaleString('pt-BR') : '-'}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Histórico de pagamentos</h3>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={paymentsPage <= 1 || isFetchingPayments}
                        onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!!dataPayments && paymentsPage >= (dataPayments.totalPaginas ?? 1) || isFetchingPayments}
                        onClick={() => setPaymentsPage((p) => (dataPayments ? Math.min(dataPayments.totalPaginas ?? 1, p + 1) : p + 1))}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(dataPayments?.payments ?? []).length === 0 && (
                      <p className="text-sm text-muted-foreground">Sem pagamentos registrados.</p>
                    )}
                    {(dataPayments?.payments ?? []).map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{new Date(p.paid_at).toLocaleString('pt-BR')}</p>
                          <p className="text-xs text-muted-foreground break-all">{p.note ?? '-'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {p.amount != null ? p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => mutateDeletePayment(p.id)}
                            disabled={isloadingmutateDeletePayment}
                            title="Excluir pagamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};
