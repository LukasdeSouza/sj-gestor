import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Shield, User as UserIcon, CalendarClock, Hash, Search, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SkeletonInformation from "@/components/Skeletons/SkeletonInformation";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PopUpCreateUser } from "@/components/User/PopUpCreateUser";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { PopupAlterUser } from "@/components/User/PopUpAlterUser";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMutation, useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Separator } from "@/components/ui/separator";
import { UsersResponse } from "@/api/models/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import { useState } from "react";
import { listAllPayments, PaymentStatus } from "@/api/models/payments";
import AdminPaymentModal from "@/components/Payments/AdminPaymentModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | undefined>();

  const { data: dataUsers, isLoading: isloadingUsers, refetch } = useQuery<UsersResponse>({
    queryKey: ["listUsers"],
    queryFn: async () => {
      return await fetchUseQuery<undefined, UsersResponse>({
        route: `/users`,
        method: "GET",
      });
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["admin", "payments", paymentStatusFilter],
    queryFn: async () => {
      try {
        return await listAllPayments({ status: paymentStatusFilter });
      } catch {
        return [];
      }
    },
    retry: 0,
    enabled: activeTab === "payments",
  });

  const filteredUsers = dataUsers?.users?.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  const { mutate: mutateDelete, isPending: isloadingDataDelete } = useMutation({
    mutationFn: async (id: string) => {
      return await fetchUseQuery({
        route: `/users/${id}`,
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

  if (isloadingUsers) {
    return <SkeletonInformation />
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento</h1>
            <p className="text-muted-foreground">Visualize usuários e pagamentos do sistema</p>
          </div>

          {activeTab === "users" && (
            <PopUpCreateUser
              onSuccess={() => refetch()}
            />
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          </TabsList>

          {/* Aba Usuários */}
          <TabsContent value="users" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuários por nome ou email..."
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
                      <TableHead>Email</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((user) => (
                      <TableRow
                        key={user.id}
                        className="hover:bg-accent/40"
                        onClick={() => {
                          setSelectedUser(user);
                          setViewOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {user.subscription?.plan_id ?? "-"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {user.subscription?.status ?? "-"}
                        </TableCell>
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <span onClick={(e) => e.stopPropagation()}>
                            <PopupAlterUser id={user.id} onSuccess={() => refetch()} />
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              mutateDelete(user.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredUsers && filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Pagamentos */}
          <TabsContent value="payments" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <Button
                      variant={paymentStatusFilter === undefined ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentStatusFilter(undefined)}
                    >
                      Todos
                    </Button>
                    <Button
                      variant={paymentStatusFilter === "PENDING" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentStatusFilter("PENDING")}
                    >
                      Pendentes
                    </Button>
                    <Button
                      variant={paymentStatusFilter === "PROOF_UPLOADED" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentStatusFilter("PROOF_UPLOADED")}
                    >
                      Comprovante Enviado
                    </Button>
                    <Button
                      variant={paymentStatusFilter === "APPROVED" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentStatusFilter("APPROVED")}
                    >
                      Aprovados
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingPayments ? (
                  <div className="text-center py-8">Carregando pagamentos...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments?.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-accent/40">
                          <TableCell className="font-medium">{payment.userName}</TableCell>
                          <TableCell>{payment.userEmail}</TableCell>
                          <TableCell>{payment.planId}</TableCell>
                          <TableCell>
                            {payment.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                payment.status === "APPROVED"
                                  ? "default"
                                  : payment.status === "PROOF_UPLOADED"
                                  ? "outline"
                                  : payment.status === "REJECTED"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {payment.status === "PENDING"
                                ? "Pendente"
                                : payment.status === "PROOF_UPLOADED"
                                ? "Comprovante Enviado"
                                : payment.status === "APPROVED"
                                ? "Aprovado"
                                : payment.status === "REJECTED"
                                ? "Rejeitado"
                                : "Cancelado"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(payment.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setPaymentModalOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {!isLoadingPayments && payments && payments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum pagamento encontrado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Visualização rápida do usuário (UI aprimorada) */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-primary" />
                Detalhes do usuário
              </DialogTitle>
            </DialogHeader>

            {selectedUser ? (
              <div className="space-y-4">
                {/* Header com avatar e info principal */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {selectedUser.name?.split(" ")?.map((n: string) => n[0])?.slice(0, 2).join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{selectedUser.name}</p>
                      {selectedUser.group?.name ? (
                        <Badge variant="secondary" className="uppercase tracking-wide">
                          <Shield className="h-3 w-3 mr-1" /> {selectedUser.group.name}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{selectedUser.email}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Grid de detalhes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Plano</p>
                    <p className="font-medium break-words">
                      {selectedUser.subscription?.plan_id ?? "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div>
                      {selectedUser.subscription?.status ? (
                        <Badge
                          className={
                            selectedUser.subscription.status === "ACTIVE"
                              ? "bg-emerald-500 hover:bg-emerald-600"
                              : selectedUser.subscription.status === "PENDING"
                              ? "bg-amber-500 hover:bg-amber-600"
                              : "bg-slate-500 hover:bg-slate-600"
                          }
                        >
                          {selectedUser.subscription.status}
                        </Badge>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Ativado em</p>
                    <p className="font-medium flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      {selectedUser.subscription?.activatedAt
                        ? new Date(selectedUser.subscription.activatedAt).toLocaleString("pt-BR")
                        : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Pagamento ref.</p>
                    <p className="font-medium flex items-center gap-2 break-all">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      {selectedUser.subscription?.mp_payment_id ?? "-"}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Metadados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Criado em</p>
                    <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Atualizado em</p>
                    <p className="font-medium">{new Date(selectedUser.updatedAt).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Admin Payment Modal */}
        {selectedPayment && (
          <AdminPaymentModal
            isOpen={paymentModalOpen}
            onClose={() => {
              setPaymentModalOpen(false);
              setSelectedPayment(null);
            }}
            payment={selectedPayment}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
