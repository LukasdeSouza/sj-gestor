import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Charge {
  id: string;
  client_id: string;
  product_id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  notes: string | null;
  clients?: { name: string; phone: string } | null;
  products?: { name: string } | null;
}

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  value: number;
}

const Charges = () => {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    client_id: "",
    product_id: "",
    amount: "",
    due_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchCharges();
    fetchClients();
    fetchProducts();
  }, []);

  const fetchCharges = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("charges")
      .select(`
        *,
        clients (name, phone),
        products (name)
      `)
      .eq("user_id", user.id)
      .order("due_date", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao carregar cobranças" });
    } else {
      setCharges(data || []);
    }
  };

  const fetchClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("clients")
      .select("id, name, phone")
      .eq("user_id", user.id);

    setClients(data || []);
  };

  const fetchProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("products")
      .select("id, name, value")
      .eq("user_id", user.id);

    setProducts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const chargeData = {
      ...formData,
      user_id: user.id,
      amount: parseFloat(formData.amount),
    };

    if (editingCharge) {
      const { error } = await supabase
        .from("charges")
        .update(chargeData)
        .eq("id", editingCharge.id);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar cobrança" });
      } else {
        toast({ title: "Cobrança atualizada com sucesso!" });
        setOpen(false);
        fetchCharges();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("charges").insert([chargeData]);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao criar cobrança" });
      } else {
        toast({ title: "Cobrança criada com sucesso!" });
        setOpen(false);
        fetchCharges();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("charges").delete().eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir cobrança" });
    } else {
      toast({ title: "Cobrança excluída com sucesso!" });
      fetchCharges();
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    const { error } = await supabase
      .from("charges")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao marcar como pago" });
    } else {
      toast({ title: "Cobrança marcada como paga!" });
      fetchCharges();
    }
  };

  const handleEdit = (charge: Charge) => {
    setEditingCharge(charge);
    setFormData({
      client_id: charge.client_id,
      product_id: charge.product_id,
      amount: charge.amount.toString(),
      due_date: charge.due_date,
      notes: charge.notes || "",
    });
    setOpen(true);
  };

  const resetForm = () => {
    setFormData({
      client_id: "",
      product_id: "",
      amount: "",
      due_date: "",
      notes: "",
    });
    setEditingCharge(null);
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setFormData({ 
      ...formData, 
      product_id: productId,
      amount: product ? product.value.toString() : formData.amount
    });
  };

  const filteredCharges = charges.filter((charge) => {
    const matchesSearch = 
      charge.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charge.products?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || charge.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pendente" },
      paid: { variant: "default", label: "Pago" },
      cancelled: { variant: "outline", label: "Cancelado" },
      overdue: { variant: "destructive", label: "Vencido" },
    };
    
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Cobranças</h1>
            <p className="text-muted-foreground">Gerencie suas cobranças</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Cobrança
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCharge ? "Editar Cobrança" : "Nova Cobrança"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product">Produto *</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={handleProductChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - R$ {product.value.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date">Data de Vencimento *</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingCharge ? "Atualizar" : "Criar"} Cobrança
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cobranças..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCharges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell className="font-medium">
                      {charge.clients?.name}
                    </TableCell>
                    <TableCell>{charge.products?.name}</TableCell>
                    <TableCell>R$ {charge.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {format(new Date(charge.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getStatusBadge(charge.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {charge.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsPaid(charge.id)}
                          title="Marcar como pago"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(charge)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(charge.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Charges;
