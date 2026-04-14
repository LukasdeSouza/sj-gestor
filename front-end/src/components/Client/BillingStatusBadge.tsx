import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUseQuery } from '@/api/services/fetchUseQuery';
import { Calendar, Clock, CheckCircle2, AlertCircle, Pause, Settings } from 'lucide-react';

interface BillingStatusBadgeProps {
  clientId: string;
  clientName: string;
}

interface BillingStats {
  total: number;
  sent: number;
  scheduled: number;
  failed: number;
  success_rate: number;
  next_scheduled?: { date: string; days_until: number };
  is_active: boolean;
}

type Variant = 'none' | 'active' | 'scheduled' | 'failed' | 'done' | 'inactive';

function getVariant(stats: BillingStats | null): Variant {
  if (!stats || stats.total === 0) return 'none';
  if (!stats.is_active) return 'inactive';
  if (stats.failed > 0) return 'failed';
  if (stats.scheduled > 0) return 'scheduled';
  return 'done';
}

const VARIANT_STYLES: Record<Variant, { bg: string; border: string; color: string }> = {
  none:      { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: '#3A5A50' },
  active:    { bg: 'rgba(0,200,150,0.08)',   border: 'rgba(0,200,150,0.2)',    color: '#00C896' },
  scheduled: { bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.2)',   color: '#6366f1' },
  failed:    { bg: 'rgba(232,69,69,0.08)',   border: 'rgba(232,69,69,0.2)',    color: '#E84545' },
  done:      { bg: 'rgba(0,200,150,0.08)',   border: 'rgba(0,200,150,0.2)',    color: '#00C896' },
  inactive:  { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',   color: '#F5A623' },
};

const chip = (variant: Variant): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  background: VARIANT_STYLES[variant].bg,
  border: `1px solid ${VARIANT_STYLES[variant].border}`,
  color: VARIANT_STYLES[variant].color,
  borderRadius: 20, padding: '3px 9px',
  fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
});

export function BillingStatusBadge({ clientId }: BillingStatusBadgeProps) {
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadStats(); }, [clientId]);

  async function loadStats() {
    try {
      const data = await fetchUseQuery<undefined, BillingStats>({
        route: `/billing/stats/${clientId}`, method: 'GET',
      });
      setStats(data);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }

  const editBtn: React.CSSProperties = {
    background: 'none', border: '1px solid rgba(255,255,255,0.07)',
    color: '#3A5A50', borderRadius: 7, padding: '3px 8px',
    fontSize: 11, fontWeight: 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 4,
    transition: 'border-color 0.15s, color 0.15s',
  };

  if (loading) {
    return (
      <div style={{
        width: 64, height: 22, borderRadius: 20,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)',
        backgroundSize: '400px 100%',
        animation: 'sk-shimmer 1.5s ease-in-out infinite',
      }} />
    );
  }

  const variant = getVariant(stats);

  if (variant === 'none') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={chip('none')}>
          <Clock size={10} /> Sem régua
        </span>
        <button
          style={editBtn}
          onClick={() => navigate(`/billing-rules/${clientId}`)}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,200,150,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#00C896'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = '#3A5A50'; }}
        >
          Configurar
        </button>
      </div>
    );
  }

  const label = variant === 'inactive'
    ? 'Inativa'
    : variant === 'failed'
    ? `${stats!.failed} falha${stats!.failed > 1 ? 's' : ''}`
    : variant === 'scheduled'
    ? `${stats!.scheduled} agendada${stats!.scheduled > 1 ? 's' : ''}`
    : `${stats!.sent}/${stats!.total} enviadas`;

  const Icon = variant === 'inactive' ? Pause
    : variant === 'failed'    ? AlertCircle
    : variant === 'scheduled' ? Calendar
    : CheckCircle2;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={chip(variant)}>
        <Icon size={10} /> {label}
      </span>
      {stats?.next_scheduled && variant === 'scheduled' && (
        <span style={chip('scheduled')}>
          <Clock size={10} /> D+{stats.next_scheduled.days_until}
        </span>
      )}
      <button
        style={editBtn}
        onClick={() => navigate(`/billing-rules/${clientId}`)}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#6366f1'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = '#3A5A50'; }}
      >
        <Settings size={11} />
      </button>
    </div>
  );
}
