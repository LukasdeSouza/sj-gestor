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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { validateBrazilianPhone, formatPhoneNumber } from "@/lib/phoneValidation";

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  product_id: string | null;
  due_date: number | null;
  auto_billing: boolean;
  additional_info: string | null;
  products?: { name: string; value: number } | null;
}

interface Product {
  id: string;
  name: string;
  value: number;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    product_id: "",
    due_date: "",
    auto_billing: false,
    additional_info: "",
  });

  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  const fetchClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("clients")
      .select(`
        *,
        products (name, value)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao carregar clientes" });
    } else {
      setClients(data || []);
    }
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
    
    // Validar telefone
    if (!validateBrazilianPhone(formData.phone)) {
      setPhoneError("Telefone inválido. Use o formato: (11) 99999-9999");
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const clientData = {
      ...formData,
      user_id: user.id,
      product_id: formData.product_id || null,
      due_date: formData.due_date ? parseInt(formData.due_date) : null,
    };

    if (editingClient) {
      const { error } = await supabase
        .from("clients")
        .update(clientData)
        .eq("id", editingClient.id);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar cliente" });
      } else {
        toast({ title: "Cliente atualizado com sucesso!" });
        setOpen(false);
        fetchClients();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("clients").insert([clientData]);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao criar cliente" });
      } else {
        toast({ title: "Cliente criado com sucesso!" });
        setOpen(false);
        fetchClients();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir cliente" });
    } else {
      toast({ title: "Cliente excluído com sucesso!" });
      fetchClients();
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email || "",
      product_id: client.product_id || "",
      due_date: client.due_date?.toString() || "",
      auto_billing: client.auto_billing,
      additional_info: client.additional_info || "",
    });
    setOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      product_id: "",
      due_date: "",
      auto_billing: false,
      additional_info: "",
    });
    setEditingClient(null);
    setPhoneError(null);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData({ ...formData, phone: formatted });
    
    // Limpa erro ao começar a digitar
    if (phoneError) {
      setPhoneError(null);
    }
    
    // Valida se já tem caracteres suficientes
    if (value.replace(/\D/g, '').length >= 10) {
      if (!validateBrazilianPhone(formatted)) {
        setPhoneError("Telefone inválido");
      }
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">Gerencie seus clientes</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "Editar Cliente" : "Novo Cliente"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="(11) 99999-9999"
                      required
                      className={phoneError ? "border-destructive" : ""}
                    />
                    {phoneError && (
                      <p className="text-sm text-destructive">{phoneError}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product">Produto</Label>
                    <Select
                      value={formData.product_id}
                      onValueChange={(value) => setFormData({ ...formData, product_id: value })}
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

                  <div className="space-y-2">
                    <Label htmlFor="due_date">Dia de Vencimento</Label>
                    <Input
                      id="due_date"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      placeholder="1-31"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_billing"
                    checked={formData.auto_billing}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_billing: checked })}
                  />
                  <Label htmlFor="auto_billing">Cobrança automática</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_info">Informações Adicionais</Label>
                  <Textarea
                    id="additional_info"
                    value={formData.additional_info}
                    onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingClient ? "Atualizar" : "Criar"} Cliente
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
                  <TableHead>Produto</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Cobrança Auto</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>
                      {client.products ? `${client.products.name} (R$ ${client.products.value.toFixed(2)})` : "-"}
                    </TableCell>
                    <TableCell>{client.due_date ? `Dia ${client.due_date}` : "-"}</TableCell>
                    <TableCell>{client.auto_billing ? "Sim" : "Não"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(client)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(client.id)}
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

export default Clients;
