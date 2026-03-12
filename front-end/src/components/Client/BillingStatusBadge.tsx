import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, AlertCircle, Pause, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  next_scheduled?: {
    date: string;
    days_until: number;
  };
  is_active: boolean;
}

export function BillingStatusBadge({ clientId, clientName }: BillingStatusBadgeProps) {
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBillingStats();
  }, [clientId]);

  const loadBillingStats = async () => {
    try {
      const response = await fetch(`/api/billing/stats/${clientId}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>;
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Sem régua
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/billing-rules/${clientId}`)}
          className="text-xs h-6 px-2"
        >
          Configurar
        </Button>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!stats.is_active) return 'bg-gray-100 text-gray-800';
    if (stats.failed > 0) return 'bg-red-100 text-red-800';
    if (stats.scheduled > 0) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusIcon = () => {
    if (!stats.is_active) return <Pause className="w-3 h-3" />;
    if (stats.failed > 0) return <AlertCircle className="w-3 h-3" />;
    if (stats.scheduled > 0) return <Calendar className="w-3 h-3" />;
    return <CheckCircle className="w-3 h-3" />;
  };

  const getStatusText = () => {
    if (!stats.is_active) return 'Pausada';
    if (stats.failed > 0) return `${stats.failed} falhas`;
    if (stats.scheduled > 0) return `${stats.scheduled} agendadas`;
    return 'Concluída';
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="ml-1">
          {stats.sent}/{stats.total} ({getStatusText()})
        </span>
      </Badge>
      
      {stats.next_scheduled && stats.is_active && (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
          <Calendar className="w-3 h-3 mr-1" />
          D+{stats.next_scheduled.days_until}
        </Badge>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/billing-rules/${clientId}`)}
        className="text-xs h-6 px-2"
      >
        Gerenciar
      </Button>
    </div>
  );
}
