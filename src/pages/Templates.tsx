import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Eye } from "lucide-react";

interface Template {
  id: string;
  name: string;
  content: string;
}

const Templates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    content: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("message_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao carregar templates" });
    } else {
      setTemplates(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const templateData = {
      ...formData,
      user_id: user.id,
    };

    if (editingTemplate) {
      const { error } = await supabase
        .from("message_templates")
        .update(templateData)
        .eq("id", editingTemplate.id);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar template" });
      } else {
        toast({ title: "Template atualizado com sucesso!" });
        setOpen(false);
        fetchTemplates();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("message_templates").insert([templateData]);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao criar template" });
      } else {
        toast({ title: "Template criado com sucesso!" });
        setOpen(false);
        fetchTemplates();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("message_templates").delete().eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir template" });
    } else {
      toast({ title: "Template excluído com sucesso!" });
      fetchTemplates();
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
    });
    setOpen(true);
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", content: "" });
    setEditingTemplate(null);
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Templates de Mensagem</h1>
            <p className="text-muted-foreground">Gerencie templates para envio de cobranças</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Editar Template" : "Novo Template"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Template *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Cobrança Mensal"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Mensagem *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Digite a mensagem do template..."
                    rows={8}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Dica: Use variáveis como {"{nome}"}, {"{valor}"}, {"{vencimento}"} para personalizar
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  {editingTemplate ? "Atualizar" : "Criar"} Template
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
                placeholder="Buscar templates..."
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
                  <TableHead>Preview</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {template.content}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id)}
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

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{previewTemplate?.name}</DialogTitle>
            </DialogHeader>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {previewTemplate?.content}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Templates;
