import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface PixKey {
  id: string;
  key_type: string;
  key_value: string;
  label: string | null;
}

const PixKeys = () => {
  const [pixKeys, setPixKeys] = useState<PixKey[]>([]);
  const [open, setOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<PixKey | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    key_type: "",
    key_value: "",
    label: "",
  });

  const keyTypes = [
    { value: "cpf", label: "CPF" },
    { value: "cnpj", label: "CNPJ" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Telefone" },
    { value: "random", label: "Chave Aleatória" },
  ];

  useEffect(() => {
    fetchPixKeys();
  }, []);

  const fetchPixKeys = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("pix_keys")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao carregar chaves PIX" });
    } else {
      setPixKeys(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const keyData = {
      ...formData,
      user_id: user.id,
      label: formData.label || null,
    };

    if (editingKey) {
      const { error } = await supabase
        .from("pix_keys")
        .update(keyData)
        .eq("id", editingKey.id);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar chave PIX" });
      } else {
        toast({ title: "Chave PIX atualizada com sucesso!" });
        setOpen(false);
        fetchPixKeys();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("pix_keys").insert([keyData]);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao criar chave PIX" });
      } else {
        toast({ title: "Chave PIX criada com sucesso!" });
        setOpen(false);
        fetchPixKeys();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("pix_keys").delete().eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir chave PIX" });
    } else {
      toast({ title: "Chave PIX excluída com sucesso!" });
      fetchPixKeys();
    }
  };

  const handleEdit = (key: PixKey) => {
    setEditingKey(key);
    setFormData({
      key_type: key.key_type,
      key_value: key.key_value,
      label: key.label || "",
    });
    setOpen(true);
  };

  const resetForm = () => {
    setFormData({ key_type: "", key_value: "", label: "" });
    setEditingKey(null);
  };

  const filteredKeys = pixKeys.filter((key) =>
    key.key_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Chaves PIX</h1>
            <p className="text-muted-foreground">Gerencie suas chaves PIX para pagamento</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Chave PIX
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingKey ? "Editar Chave PIX" : "Nova Chave PIX"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="key_type">Tipo de Chave *</Label>
                  <Select
                    value={formData.key_type}
                    onValueChange={(value) => setFormData({ ...formData, key_type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {keyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key_value">Chave *</Label>
                  <Input
                    id="key_value"
                    value={formData.key_value}
                    onChange={(e) => setFormData({ ...formData, key_value: e.target.value })}
                    placeholder="Digite a chave PIX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Identificação</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Ex: Conta Principal"
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingKey ? "Atualizar" : "Criar"} Chave PIX
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar chaves PIX..."
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Identificação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <Badge variant="secondary">
                        {keyTypes.find((t) => t.value === key.key_type)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{key.key_value}</TableCell>
                    <TableCell>{key.label || "-"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(key)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(key.id)}
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

export default PixKeys;
