import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageTemplate } from "@/api/models/messageTemplate";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SpinnerLoading from "../SpinnerLoading";
import { Label } from "../ui/label";
import { Eye } from "lucide-react";
import { useState } from "react";

interface Props {
  id: string;
}

export function PopupViewTemplate({ id }: Props) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery<MessageTemplate>({
    queryKey: ["getTemplates", id],
    queryFn: async () => {
      return await fetchUseQuery<undefined, MessageTemplate>({
        route: `/message_templates/${id}`,
        method: "GET",
      });
    },
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: open && !!id,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualizar Template</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <SpinnerLoading />
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <p>{data?.name}</p>
            </div>

            <div>
              <Label>Mensagem</Label>
              <p>{data?.content}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}