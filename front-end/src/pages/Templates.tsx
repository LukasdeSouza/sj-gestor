import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageTemplate, MessageTemplatesResponse } from "@/api/models/messageTemplate";
import { PopUpCreateTemplate } from "@/components/templates/PopUpCreateTemplate";
import { PopUpAlterTemplate } from "@/components/templates/PopUpAlterTemplate";
import SkeletonInformation from "@/components/Skeletons/SkeletonInformation";
import { PopupViewTemplate } from "@/components/templates/PopUpViewTemplate";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useMutation, useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AuthUser } from "@/api/models/auth";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const { data: dataTemplates, isLoading: isloadingtemplate, isFetching, refetch } = useQuery<MessageTemplatesResponse>({
    queryKey: ["listTemplates", parsedUser.id, debouncedSearch, page, limit],
    queryFn: async () => {
      return await fetchUseQuery<{ user_id: string; name?: string; page: number; limit: number }, MessageTemplatesResponse>({
        route: `/message_templates`,
        method: "GET",
        data: { user_id: parsedUser.id, name: debouncedSearch || undefined, page, limit },
      });
    },
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!parsedUser.id,
  });

  const totalPages = useMemo(() => dataTemplates?.totalPaginas ?? 1, [dataTemplates]);
  const currentPage = useMemo(() => dataTemplates?.pagina ?? page, [dataTemplates, page]);

  const { mutate: mutateDelete, isPending: isloadingmutateDelete } = useMutation({
    mutationFn: async (id: string) => {
      return await fetchUseQuery({
        route: `/message_templates/${id}`,
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

  if (isloadingtemplate) {
    return <SkeletonInformation />
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Templates de Mensagem</h1>
            <p className="text-muted-foreground">Gerencie templates para envio de cobranças</p>
          </div>

          <PopUpCreateTemplate
            onSuccess={() => refetch()}
          />
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
                {dataTemplates?.templates?.map((template) => (
                  <TableRow
                    key={template.id}
                    className="hover:bg-accent/40 cursor-pointer"
                    onClick={() => { setSelectedTemplate(template); setViewOpen(true); }}
                  >
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {template.content}
                    </TableCell>
                  <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                    <PopupViewTemplate
                      id={template.id}
                    />
                    <PopUpAlterTemplate
                      id={template.id}
                      onSuccess={() => refetch()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => mutateDelete(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        {/* Visualização rápida da template (igual ao padrão dos Clients) */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da template</DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{selectedTemplate.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conteúdo</p>
                  <div className="rounded-md border bg-muted/30 p-3 whitespace-pre-wrap text-sm">
                    {selectedTemplate.content}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
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
