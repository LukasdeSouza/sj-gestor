import { useState, useEffect, useRef } from "react";
import { Bell, MessageSquare, AlertCircle, CheckCircle2, X, EraserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabaseClient";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  createdAt: string;
}

export default function NotificationCenter({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // 1. Buscar notificações iniciais
  const { data: notificationData } = useQuery<any>({
    queryKey: ["notifications", userId],
    queryFn: async () =>
      await fetchUseQuery<{ user_id: string }, any>({
        route: "/notifications/recent",
        method: "GET",
        data: { user_id: userId },
      }),
    enabled: !!userId,
  });

  const notifications: Notification[] = notificationData?.notifications || [];
  const unreadCount = notificationData?.unreadCount || 0;

  // 2. Setup Real-time Listener
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Remove qualquer canal com esse nome já registrado no Supabase (StrictMode safe)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    supabase.getChannels().forEach(ch => {
      if (ch.topic === `realtime:notif_${userId}`) supabase.removeChannel(ch);
    });

    const channel = supabase
      .channel(`notif_${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newNotif = payload.new as Notification;
          toast(newNotif.title, {
            description: newNotif.message,
            icon: <Bell className="h-4 w-4 text-primary" />,
            duration: 5000,
          });
          queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
          queryClient.invalidateQueries({ queryKey: ["dashboardSummary", userId] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, queryClient]);

  const handleMarkAsRead = async (id: string) => {
    await fetchUseQuery<undefined, any>({
      route: `/notifications/${id}/read`,
      method: "PATCH",
    });
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  };

  const handleMarkAllAsRead = async () => {
    await fetchUseQuery<{ user_id: string }, any>({
      route: "/notifications/mark-all-read",
      method: "POST",
      data: { user_id: userId }
    });
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_RECEIVED': return <CheckCircle2 className="text-emerald-500 h-4 w-4" />;
      case 'COMMUNICATION_SUCCESS': return <MessageSquare className="text-blue-500 h-4 w-4" />;
      case 'COMMUNICATION_FAILED': return <X className="text-rose-500 h-4 w-4" />;
      default: return <AlertCircle className="text-amber-500 h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-black/5 transition-colors group">
          <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-muted'}`} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="z-[10000] w-80 p-0 shadow-2xl overflow-hidden rounded-xl" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)", background: "#fff" }}>
          <h3 className="text-sm font-bold text-emerald-500 font-syne">Atividades Recentes</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[10px] uppercase tracking-wider font-bold transition-colors"
              style={{ color: "var(--text2)" }}
            >
              <EraserIcon size={16} className="hover:text-black transition-colors" />
              {/* Limpar tudo */}
            </button>
          )}
        </div>

        <div className="max-h-[350px] overflow-y-auto py-1 scrollbar-hide">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs" style={{ color: "var(--text2)" }}>
              Nenhuma atividade recente encontrada.
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onSelect={(e) => { e.preventDefault(); handleMarkAsRead(n.id); }}
                className={`p-4 flex gap-3 cursor-pointer outline-none transition-colors border-l-2 rounded-sm ${n.is_read ? 'border-transparent opacity-100 hover:bg-black/5 bg-white' : 'border-emerald-500 bg-emerald-500/5'}`}
              >
                <div className="mt-1 flex-shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold mb-0.5 leading-tight" style={{ color: "var(--text1)" }}>{n.title}</div>
                  <div className="text-[11px] line-clamp-2 leading-normal mb-1" style={{ color: "var(--text2)" }}>{n.message}</div>
                  <div className="text-[9px] uppercase tracking-wide font-bold" style={{ color: "var(--text2)", opacity: 0.8 }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {/* <DropdownMenuSeparator style={{ backgroundColor: "var(--border)" }} /> */}
        {/* <div className="p-2" style={{ background: "rgba(0,0,0,0.01)" }}>
          <button className="w-full p-2 text-[11px] font-bold text-center transition-colors" style={{ color: "var(--text2)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text1)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text2)"}
          >
            Ver histórico completo
          </button>
        </div> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
