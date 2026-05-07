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
          <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-emerald-500 animate-[pulse_2s_infinite]' : 'text-slate-400'}`} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="z-[10000] w-80 p-0 shadow-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h3 className="text-[13px] font-800 text-slate-900 letter-spacing-[-0.3px]">Atividades Recentes</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              title="Marcar todas como lidas"
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all"
            >
              <EraserIcon size={15} />
            </button>
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto py-1 scrollbar-hide bg-slate-50/30">
          {notifications.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell size={18} className="text-slate-300" />
              </div>
              <p className="text-[11px] font-500 text-slate-400">Nenhuma atividade recente.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onSelect={(e) => { e.preventDefault(); handleMarkAsRead(n.id); }}
                className={`p-4 flex gap-3 cursor-pointer outline-none transition-all border-b border-slate-50 last:border-0 ${n.is_read ? 'opacity-70 grayscale-[0.5] hover:bg-white bg-transparent' : 'bg-white hover:bg-slate-50'}`}
              >
                <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${n.is_read ? 'bg-slate-100' : 'bg-emerald-50'}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[12px] font-700 leading-tight mb-1 ${n.is_read ? 'text-slate-600' : 'text-slate-900'}`}>
                    {n.title}
                  </div>
                  <div className="text-[11px] line-clamp-2 leading-relaxed text-slate-500 mb-2">
                    {n.message}
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-700 uppercase tracking-wider text-slate-400">
                    <div className={`w-1.5 h-1.5 rounded-full ${n.is_read ? 'bg-slate-200' : 'bg-emerald-500'}`} />
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
