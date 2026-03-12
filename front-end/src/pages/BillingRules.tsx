import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface BillingRule {
  id: string;
  type: string;
  days_offset: number;
  scheduled_at: string;
  status: string;
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  template: {
    subject: string;
    content: string;
  };
  day_of_week?: string;
  formatted_date?: string;
  is_delayed?: boolean;
}

interface ClientBillingConfig {
  use_niche_templates: boolean;
  niche_id?: string;
  niche?: {
    name: string;
    icon: string;
  };
  is_active: boolean;
}

interface BillingStats {
  total: number;
  sent: number;
  failed: number;
  scheduled: number;
  success_rate: number;
  last_sent?: {
    date: string;
    subject: string;
  };
  next_scheduled?: {
    date: string;
    subject: string;
    days_until: number;
  };
}

export function BillingRules() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  const [rules, setRules] = useState<BillingRule[]>([]);
  const [config, setConfig] = useState<ClientBillingConfig | null>(null);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [niches, setNiches] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (clientId) {
      loadClientData();
      loadNiches();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      const [rulesRes, statsRes] = await Promise.all([
        fetch(`/api/billing/rules/client/${clientId}`),
        fetch(`/api/billing/stats/${clientId}`)
      ]);

      const rulesData = await rulesRes.json();
      const statsData = await statsRes.json();

      if (rulesData.success) {
        setRules(rulesData.data.rules);
        setConfig(rulesData.data.config);
      }

      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNiches = async () => {
    try {
      const response = await fetch('/api/niches');
      const data = await response.json();
      
      if (data.success) {
        setNiches(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar nichos:', error);
    }
  };

  const handleCreateRules = async () => {
    if (!clientId || !selectedNiche) return;

    try {
      const response = await fetch(`/api/billing/rules/${clientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useNicheTemplates: true,
          nicheId: selectedNiche
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Regras criadas: ${data.data.rules_created}`);
        setShowCreateModal(false);
        loadClientData();
      }
    } catch (error) {
      console.error('Erro ao criar regras:', error);
    }
  };

  const handleToggleBilling = async (action: 'pause' | 'resume') => {
    if (!clientId) return;

    try {
      const response = await fetch(`/api/billing/rules/${clientId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Régua ${action === 'pause' ? 'pausada' : 'reativada'} com sucesso`);
        loadClientData();
      }
    } catch (error) {
      console.error('Erro ao alterar régua:', error);
    }
  };

  const handleResendRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/billing/resend/${ruleId}`, {
        method: 'POST'
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Cobrança reenviada com sucesso');
        loadClientData();
      }
    } catch (error) {
      console.error('Erro ao reenviar cobrança:', error);
    }
  };

  const handleCancelRule = async (ruleId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta cobrança?')) {
      return;
    }

    try {
      const response = await fetch(`/api/billing/cancel/${ruleId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Cobrança cancelada com sucesso');
        loadClientData();
      }
    } catch (error) {
      console.error('Erro ao cancelar cobrança:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'Enviado';
      case 'failed': return 'Falhou';
      case 'scheduled': return 'Agendado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getTypeText = (type: string, daysOffset: number) => {
    if (daysOffset < 0) return `Pré-vencimento (D${daysOffset})`;
    if (daysOffset === 0) return 'No vencimento';
    return `Pós-vencimento (D+${daysOffset})`;
  };

  const filteredRules = filterStatus === 'all' 
    ? rules 
    : rules.filter(rule => rule.status === filterStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Régua de Cobrança</h1>
              <p className="text-gray-600 mt-1">
                Gerencie envios automáticos e visualize o histórico completo
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistoryModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                📊 Ver Histórico
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                ← Voltar
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total de Cobranças</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
              <div className="text-sm text-gray-600">Enviadas ({stats.success_rate}%)</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
              <div className="text-sm text-gray-600">Agendadas</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-gray-600">Falharam</div>
            </div>
          </div>
        )}

        {/* Status Atual */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {stats.last_sent && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Última Cobrança</h3>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">{stats.last_sent.subject}</div>
                  <div>{stats.last_sent.date}</div>
                </div>
              </div>
            )}
            
            {stats.next_scheduled && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Próxima Cobrança</h3>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">{stats.next_scheduled.subject}</div>
                  <div>{stats.next_scheduled.date}</div>
                  <div className="text-blue-600">Em {stats.next_scheduled.days_until} dias</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Controle da Régua</h2>
          
          <div className="flex flex-wrap gap-4">
            {config?.is_active ? (
              <button
                onClick={() => handleToggleBilling('pause')}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                ⏸️ Pausar Régua
              </button>
            ) : (
              <button
                onClick={() => handleToggleBilling('resume')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ▶️ Reativar Régua
              </button>
            )}
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ⚙️ Reconfigurar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filtrar por status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="sent">Enviados</option>
              <option value="scheduled">Agendados</option>
              <option value="failed">Falharam</option>
              <option value="cancelled">Cancelados</option>
            </select>
            
            <div className="text-sm text-gray-600">
              Mostrando {filteredRules.length} de {rules.length} cobranças
            </div>
          </div>
        </div>

        {/* Lista de Regras */}
        {filteredRules.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Cobranças {filterStatus === 'all' ? '' : `- ${getStatusText(filterStatus)}`}
            </h2>
            
            <div className="space-y-4">
              {filteredRules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{rule.template.subject}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(rule.status)}`}>
                          {getStatusText(rule.status)}
                        </span>
                        {rule.is_delayed && rule.status === 'scheduled' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            ⚠️ Atrasado
                          </span>
                        )}
                        {rule.retry_count > 0 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                            🔄 Retry: {rule.retry_count}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {getTypeText(rule.type, rule.days_offset)}
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-2">
                        {rule.formatted_date || new Date(rule.scheduled_at).toLocaleString('pt-BR')}
                        {rule.day_of_week && ` • ${rule.day_of_week}`}
                      </div>
                      
                      {rule.error_message && (
                        <div className="text-sm text-red-600 mb-2">
                          ❌ Erro: {rule.error_message}
                        </div>
                      )}
                      
                      <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-20 overflow-hidden">
                        {rule.template.content.substring(0, 200)}
                        {rule.template.content.length > 200 && '...'}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {rule.status === 'failed' && (
                        <button
                          onClick={() => handleResendRule(rule.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          🔄 Reenviar
                        </button>
                      )}
                      
                      {rule.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancelRule(rule.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          ❌ Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Configuração */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reconfigurar Régua de Cobrança
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o Nicho
                </label>
                <select
                  value={selectedNiche}
                  onChange={(e) => setSelectedNiche(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Escolha um nicho...</option>
                  {niches.map((niche) => (
                    <option key={niche.id} value={niche.id}>
                      {niche.icon} {niche.name} ({niche.templates.length} templates)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleCreateRules}
                  disabled={!selectedNiche}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Reconfigurar
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
