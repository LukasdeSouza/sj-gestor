import DashboardLayout from '@/components/DashboardLayout';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUseQuery } from '@/api/services/fetchUseQuery';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, BarChart3, Zap, Send, Clock, AlertCircle,
  CheckCircle2, XCircle, RefreshCw, Ban, Play, Pause,
  Settings, Calendar, ChevronRight,
  MessageCircle, AlertTriangle, RotateCcw, Plus, Trash2,
} from 'lucide-react';
import { toast } from 'react-toastify';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface RuleStep {
  days_offset: number; type: string; subject: string; content: string; template_id?: string;
}

interface BillingRule {
  id: string; type: string; days_offset: number;
  scheduled_at: string; status: string; sent_at?: string;
  error_message?: string; retry_count: number;
  template: { subject: string; content: string };
  day_of_week?: string; formatted_date?: string; is_delayed?: boolean; can_edit?: boolean;
}

interface Niche {
  id: string; name: string; description: string; icon: string;
  templates: NicheTemplate[];
}

interface NicheTemplate {
  id: string; type: string; days_offset: number; subject: string; content: string;
}

interface ClientBillingConfig {
  use_niche_templates: boolean; niche_id?: string;
  niche?: { name: string; icon: string }; is_active: boolean;
}

interface BillingStats {
  total: number; sent: number; failed: number; scheduled: number;
  success_rate: number;
  last_sent?: { date: string; subject: string };
  next_scheduled?: { date: string; subject: string; days_until: number };
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DEFAULT_STEPS: RuleStep[] = [
  {
    days_offset: -3, type: 'pre_vencimento',
    subject: 'Lembrete de pagamento - {nome}',
    content: `Olá, {nome}! 👋\n\nGentileza lembrar que seu pagamento de {valor} vence em {vencimento}.\n\nAcesse seu link exclusivo para pagar via PIX ou Cartão:\n🔗 {link_pagamento}\n\nQualquer dúvida, estamos à disposição!`,
  },
  {
    days_offset: 0, type: 'vencimento',
    subject: 'Pagamento hoje - {nome}',
    content: `Olá, {nome}! 📅\n\nHoje é dia de pagamento!\n\nValor: {valor}\nVencimento: {vencimento}\n\nPague com segurança pelo link:\n🔗 {link_pagamento}\n\nSe já pagou, por favor ignore esta mensagem.`,
  },
  {
    days_offset: 3, type: 'pos_vencimento',
    subject: 'Pagamento em atraso - {nome}',
    content: `Olá, {nome}! ⚠️\n\nIdentificamos que seu pagamento de {valor} com vencimento em {vencimento} ainda não foi realizado.\n\nRegularize agora pelo link:\n🔗 {link_pagamento}\n\nApós o pagamento, envie o comprovante.`,
  },
];

function getTypeFromOffset(offset: number): string {
  if (offset < 0) return 'pre_vencimento';
  if (offset === 0) return 'vencimento';
  return 'pos_vencimento';
}

function getDefaultSubject(offset: number): string {
  if (offset < 0) return 'Lembrete de pagamento - {nome}';
  if (offset === 0) return 'Pagamento hoje - {nome}';
  return 'Pagamento em atraso - {nome}';
}

function getDefaultContent(offset: number): string {
  if (offset < 0) return `Olá, {nome}! 👋\n\nGentileza lembrar que seu pagamento de {valor} vence em {vencimento}.\n\n🔗 {link_pagamento}\n\nQualquer dúvida, estamos à disposição!`;
  if (offset === 0) return `Olá, {nome}! 📅\n\nHoje é dia de pagamento!\n\nValor: {valor}\n\nPague pelo link:\n🔗 {link_pagamento}\n\nSe já pagou, ignore esta mensagem.`;
  return `Olá, {nome}! ⚠️\n\nSeu pagamento de {valor} (vencimento: {vencimento}) está em atraso.\n\nAcesse seu link para pagar:\n🔗 {link_pagamento}\n\nApós o pagamento, envie o comprovante.`;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR');
}

function getTypeLabel(daysOffset: number) {
  if (daysOffset < 0) return `D${daysOffset} — Pré-vencimento`;
  if (daysOffset === 0) return 'D0 — No vencimento';
  return `D+${daysOffset} — Pós-vencimento`;
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.FC<any> }> = {
  sent: { label: 'Enviado', color: '#00C896', bg: 'rgba(0,200,150,0.08)', border: 'rgba(0,200,150,0.2)', icon: CheckCircle2 },
  failed: { label: 'Falhou', color: '#E84545', bg: 'rgba(232,69,69,0.08)', border: 'rgba(232,69,69,0.2)', icon: XCircle },
  scheduled: { label: 'Agendado', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', icon: Clock },
  cancelled: { label: 'Cancelado', color: '#64748B', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', icon: Ban },
};

// ─── STATUS PILL ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.cancelled;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      borderRadius: 100, padding: '3px 9px', fontSize: 11, fontWeight: 700,
      whiteSpace: 'nowrap', fontFamily: "'Montserrat', sans-serif",
    }}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon: Icon, sub }: {
  label: string; value: number | string; color: string; icon: React.FC<any>; sub?: string;
}) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E2E8F0',
      borderRadius: 12, padding: '1rem 1.15rem', transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.6rem', fontWeight: 800, color, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── RULE CARD ────────────────────────────────────────────────────────────────

function RuleCard({ rule, onResend, onCancel, onUpdate, templates }: {
  rule: BillingRule & { can_edit?: boolean };
  onResend: (id: string) => void;
  onCancel: (id: string) => void;
  onUpdate: (ruleId: string, data: any) => Promise<void>;
  templates: any[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    subject: rule.template.subject,
    content: rule.template.content,
    template_id: (rule as any).template_id || "",
    days_offset: rule.days_offset,
  });
  const [saving, setSaving] = useState(false);
  const canEdit = rule.can_edit !== false;

  const cfg = STATUS_CONFIG[rule.status] ?? STATUS_CONFIG.cancelled;

  const handleApplyTemplate = (templateId: string) => {
    if (!templateId) {
      setEditData(prev => ({ ...prev, template_id: "" }));
      return;
    }
    const t = templates.find(tmp => tmp.id === templateId);
    if (t) {
      setEditData({ subject: t.subject, content: t.content, template_id: t.id });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(rule.id, { ...editData, originalOffset: rule.days_offset });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // ── shared input style ──────────────────────────────────────────────────────
  const editInput: React.CSSProperties = {
    width: '100%', background: '#FFFFFF',
    border: '1px solid #E2E8F0', borderRadius: 8,
    padding: '8px 10px', fontSize: 13, color: '#0F172A', outline: 'none',
    fontFamily: " 'Montserrat', sans-serif",
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: `1px solid ${rule.status === 'failed' ? 'rgba(232,69,69,0.18)' : rule.status === 'sent' ? 'rgba(0,200,150,0.1)' : '#E2E8F0'}`,
      borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div
        style={{ padding: '0.85rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
        }}>
          <cfg.icon size={15} color={cfg.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', fontFamily: "'Montserrat', sans-serif" }}>{rule.template.subject}</span>
            <StatusPill status={rule.status} />
            {!canEdit && rule.status === 'scheduled' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,0.08)', color: '#F5A623', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                🔒 Recorrência ativa
              </span>
            )}
            {rule.is_delayed && rule.status === 'scheduled' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,0.08)', color: '#F5A623', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                <AlertTriangle size={9} /> Atrasado
              </span>
            )}
            {rule.retry_count > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,0.06)', color: '#F5A623', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                <RotateCcw size={9} /> {rule.retry_count}× retry
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={10} color="#6366f1" /> {getTypeLabel(rule.days_offset)}
            </span>
            <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={10} />
              {rule.formatted_date || formatDateTime(rule.scheduled_at)}
              {rule.day_of_week && ` · ${rule.day_of_week}`}
            </span>
            {rule.sent_at && (
              <span style={{ fontSize: 11, color: '#00C896', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Send size={10} /> Enviado {formatDateTime(rule.sent_at)}
              </span>
            )}
          </div>

          {rule.error_message && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 7, background: 'rgba(232,69,69,0.06)', border: '1px solid rgba(232,69,69,0.15)', borderRadius: 8, padding: '7px 10px' }}>
              <AlertCircle size={11} color="#E84545" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 11, color: '#E84545', lineHeight: 1.5 }}>{rule.error_message}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          {rule.status === 'failed' && (
            <button onClick={() => onResend(rule.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', color: '#6366f1', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
              <RefreshCw size={11} /> Reenviar
            </button>
          )}
          {rule.status === 'scheduled' && (
            <>
              <button 
                onClick={() => { setIsEditing(!isEditing); if (!expanded) setExpanded(true); }} 
                disabled={!canEdit}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: canEdit ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.03)', border: `1px solid ${canEdit ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)'}`, color: canEdit ? '#6366f1' : '#64748B', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: canEdit ? 'pointer' : 'not-allowed', fontFamily: "'Montserrat', sans-serif", opacity: canEdit ? 1 : 0.5 }}>
                <Settings size={11} /> {isEditing ? 'Cancelar' : 'Editar'}
              </button>
              <button 
                onClick={() => onCancel(rule.id)} 
                disabled={!canEdit}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: canEdit ? 'rgba(232,69,69,0.07)' : 'rgba(232,69,69,0.03)', border: `1px solid ${canEdit ? 'rgba(232,69,69,0.18)' : 'rgba(232,69,69,0.08)'}`, color: canEdit ? '#E84545' : '#64748B', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: canEdit ? 'pointer' : 'not-allowed', fontFamily: "'Montserrat', sans-serif", opacity: canEdit ? 1 : 0.5 }}>
                <Ban size={11} /> Cancelar
              </button>
            </>
          )}
          <ChevronRight size={14} style={{ color: '#94A3B8', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={() => setExpanded((e) => !e)} />
        </div>
      </div>

      {/* Expanded preview / edit */}
      {expanded && (
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ paddingTop: '0.85rem' }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }}>Dias de offset</label>
                  <input
                    type="number"
                    value={editData.days_offset}
                    onChange={(e) => setEditData(prev => ({ ...prev, days_offset: parseInt(e.target.value) || 0 }))}
                    style={{ ...editInput, width: '100%' }}
                  />
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
                    {editData.days_offset < 0 ? `${editData.days_offset} dias antes do vencimento` : editData.days_offset === 0 ? 'No dia do vencimento' : `${editData.days_offset} dias após o vencimento`}
                  </div>
                </div>
                {templates.length > 0 && (
                  <div>
                    <label style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }}>Vincular a um template</label>
                    <select
                      value={editData.template_id}
                      onChange={(e) => handleApplyTemplate(e.target.value)}
                      style={{ ...editInput, cursor: 'pointer', borderColor: editData.template_id ? 'rgba(0,200,150,0.4)' : '#E2E8F0', background: editData.template_id ? 'rgba(0,200,150,0.05)' : '#FFFFFF' }}
                    >
                      <option value="">-- Texto manual --</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.title || t.subject}</option>
                      ))}
                    </select>
                    {editData.template_id && (
                      <div style={{ fontSize: 9, color: '#00C896', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#00C896', display: 'inline-block' }} />
                        Template ativo - campos bloqueados
                      </div>
                    )}
                  </div>
                )}
                <div style={{ background: editData.template_id ? 'rgba(0,200,150,0.03)' : 'transparent', border: editData.template_id ? '1px solid rgba(0,200,150,0.1)' : 'none', borderRadius: editData.template_id ? 8 : 0, padding: editData.template_id ? 10 : 0, marginBottom: editData.template_id ? 0 : -10 }}>
                  <label style={{ fontSize: 10, color: editData.template_id ? '#00C896' : '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }}>Assunto</label>
                  <input
                    value={editData.subject}
                    onChange={(e) => setEditData(prev => ({ ...prev, subject: e.target.value }))}
                    disabled={!!editData.template_id}
                    style={{ ...editInput, opacity: editData.template_id ? 0.5 : 1, background: editData.template_id ? 'rgba(0,200,150,0.08)' : '#FFFFFF', borderColor: editData.template_id ? 'rgba(0,200,150,0.2)' : '#E2E8F0', cursor: editData.template_id ? 'not-allowed' : 'text' }}
                  />
                </div>
                <div style={{ background: editData.template_id ? 'rgba(0,200,150,0.03)' : 'transparent', border: editData.template_id ? '1px solid rgba(0,200,150,0.1)' : 'none', borderRadius: editData.template_id ? 8 : 0, padding: editData.template_id ? 10 : 0 }}>
                  <label style={{ fontSize: 10, color: editData.template_id ? '#00C896' : '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }}>Mensagem</label>
                  <textarea
                    value={editData.content}
                    onChange={(e) => setEditData(prev => ({ ...prev, content: e.target.value }))}
                    disabled={!!editData.template_id}
                    rows={4}
                    style={{ ...editInput, resize: 'vertical', lineHeight: 1.6, opacity: editData.template_id ? 0.5 : 1, background: editData.template_id ? 'rgba(0,200,150,0.08)' : '#FFFFFF', borderColor: editData.template_id ? 'rgba(0,200,150,0.2)' : '#E2E8F0', cursor: editData.template_id ? 'not-allowed' : 'text' }}
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ background: '#00C896', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: "'Montserrat', sans-serif" }}
                >
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Prévia da mensagem</div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 9, padding: '10px 12px', fontSize: 12, color: '#334155', lineHeight: 1.75, whiteSpace: 'pre-wrap', maxHeight: 150, overflowY: 'auto' }}>
                  {rule.template.content}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export function BillingRules() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [rules, setRules] = useState<BillingRule[]>([]);
  const [config, setConfig] = useState<ClientBillingConfig | null>(null);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [togglingBilling, setTogglingBilling] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [customSteps, setCustomSteps] = useState<RuleStep[]>([...DEFAULT_STEPS]);
  const [editingStepIdx, setEditingStepIdx] = useState<number | null>(null);
  const [creatingRules, setCreatingRules] = useState(false);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [loadingNiches, setLoadingNiches] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => { if (clientId) loadClientData(); }, [clientId]);

  const loadClientData = async () => {
    try {
      const [rulesData, statsData] = await Promise.all([
        fetchUseQuery<undefined, any>({ route: `/billing/rules/client/${clientId}`, method: 'GET' }),
        fetchUseQuery<undefined, any>({ route: `/billing/stats/${clientId}`, method: 'GET' }),
      ]);
      if (rulesData) { setRules(rulesData.rules); setConfig(rulesData.config); }
      if (statsData) setStats(statsData);
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar dados da régua");
    } finally { setLoading(false); }
  };

  const handleCreateRules = async () => {
    if (customSteps.length === 0) { toast.error('Adicione pelo menos uma etapa.'); return; }
    setCreatingRules(true);
    try {
      await fetchUseQuery<any, any>({
        route: `/billing/rules/${clientId}`,
        method: 'POST',
        data: {
          useDefaultTemplates: false,
          templates: customSteps.map((s) => ({ type: s.type, days_offset: s.days_offset, subject: s.subject, content: s.content, template_id: s.template_id || null })),
        },
      });
      toast.success('Régua configurada com sucesso!');
      setShowConfigModal(false);
      loadClientData();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao configurar régua. Verifique se o cliente tem data de vencimento.');
    } finally { setCreatingRules(false); }
  };

  const openConfigModal = () => {
    setCustomSteps([...DEFAULT_STEPS]);
    setEditingStepIdx(null);
    setSelectedNiche(null);
    setShowConfigModal(true);
    loadNiches();
  };

  const loadNiches = async () => {
    setLoadingNiches(true);
    try {
      const [nichesRes, templatesRes] = await Promise.all([
        fetchUseQuery<undefined, { data: Niche[] }>({ route: '/niches', method: 'GET' }),
        fetchUseQuery<undefined, { templates: any[] }>({ route: '/templates', method: 'GET' }),
      ]);
      if (nichesRes?.data) setNiches(nichesRes.data);
      if (templatesRes?.templates) setTemplates(templatesRes.templates);
    } catch { /* silent */ } finally { setLoadingNiches(false); }
  };

  const applyNicheTemplates = (niche: Niche) => {
    setSelectedNiche(niche);
    const steps: RuleStep[] = niche.templates.map((t) => ({ days_offset: t.days_offset, type: t.type, subject: t.subject, content: t.content }));
    steps.sort((a, b) => a.days_offset - b.days_offset);
    setCustomSteps(steps);
    toast.success(`Templates de "${niche.name}" aplicados!`);
  };

  const addStep = () => {
    const maxOffset = customSteps.length > 0 ? Math.max(...customSteps.map((s) => s.days_offset)) : 0;
    const newOffset = maxOffset + 5;
    setCustomSteps((prev) => [...prev, { days_offset: newOffset, type: getTypeFromOffset(newOffset), subject: getDefaultSubject(newOffset), content: getDefaultContent(newOffset) }]);
  };

  const removeStep = (idx: number) => {
    setCustomSteps((prev) => prev.filter((_, i) => i !== idx));
    if (editingStepIdx === idx) setEditingStepIdx(null);
  };

  const updateStepOffset = (idx: number, offset: number) => {
    setCustomSteps((prev) => prev.map((s, i) => i === idx ? { ...s, days_offset: offset, type: getTypeFromOffset(offset) } : s));
  };

  const updateStepField = (idx: number, field: 'subject' | 'content' | 'template_id', value: string) => {
    setCustomSteps((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const applyTemplateToStep = (idx: number, templateId: string) => {
    if (!templateId) {
      updateStepField(idx, 'template_id', '');
      return;
    }
    const t = templates.find((tmp) => tmp.id === templateId);
    if (t) {
      setCustomSteps((prev) => prev.map((s, i) => i === idx ? { ...s, subject: t.subject, content: t.content, template_id: t.id } : s));
    }
  };

  const [pendingToggleAction, setPendingToggleAction] = useState<'pause' | 'resume' | null>(null);

  const handleToggleClick = (action: 'pause' | 'resume') => {
    setPendingToggleAction(action);
    setShowPauseConfirm(true);
  };

  const handleToggleConfirm = async () => {
    if (!clientId || !pendingToggleAction) return;
    setTogglingBilling(true);
    try {
      await fetchUseQuery<any, any>({ route: `/billing/rules/${clientId}/toggle`, method: 'POST', data: { action: pendingToggleAction } });
      toast.success(pendingToggleAction === 'pause' ? 'Régua pausada!' : 'Régua reativada!');
      loadClientData();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao alternar régua');
    } finally { 
      setTogglingBilling(false);
      setShowPauseConfirm(false);
      setPendingToggleAction(null);
    }
  };

  const handleResend = async (ruleId: string) => {
    try {
      await fetchUseQuery<undefined, any>({ route: `/billing/rules/${ruleId}/resend`, method: 'POST' });
      toast.success('Cobrança reenviada para a fila!');
      loadClientData();
    } catch (e: any) { toast.error(e.message || 'Erro ao reenviar'); }
  };

  const handleCancel = async (ruleId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta cobrança?')) return;
    try {
      await fetchUseQuery<undefined, any>({ route: `/billing/rules/${ruleId}/cancel`, method: 'POST' });
      toast.success('Cobrança cancelada!');
      loadClientData();
    } catch (e: any) { toast.error(e.message || 'Erro ao cancelar'); }
  };

  const handleUpdateSingleRule = async (ruleId: string, data: any) => {
    try {
      // If offset changed, call the offset endpoint
      if (data.days_offset !== data.originalOffset) {
        await fetchUseQuery<any, any>({
          route: `/billing/rules/${ruleId}/offset`,
          method: 'PATCH',
          data: { days_offset: data.days_offset }
        });
      }
      
      // Always update text/template
      await fetchUseQuery<any, any>({
        route: `/billing/rules/single/${ruleId}`,
        method: 'PUT',
        data: {
          template_id: data.template_id || null,
          subject: data.subject,
          content: data.content
        }
      });
      
      toast.success('Mensagem atualizada com sucesso!');
      loadClientData();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar mensagem');
    }
  };

  const filteredRules = filterStatus === 'all' ? rules : rules.filter((r) => r.status === filterStatus);

  const filterOptions = [
    { value: 'all', label: 'Todos', count: rules.length },
    { value: 'scheduled', label: 'Agendados', count: rules.filter((r) => r.status === 'scheduled').length },
    { value: 'sent', label: 'Enviados', count: rules.filter((r) => r.status === 'sent').length },
    { value: 'failed', label: 'Falharam', count: rules.filter((r) => r.status === 'failed').length },
    { value: 'cancelled', label: 'Cancelados', count: rules.filter((r) => r.status === 'cancelled').length },
  ];

  const uniqueOffsets = [...new Set(rules.map((r) => r.days_offset))].sort((a, b) => a - b);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(0,200,150,0.15)', borderTopColor: '#00C896', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </DashboardLayout>
    );
  }

  // ── shared input style ──────────────────────────────────────────────────────
  const modalInput: React.CSSProperties = {
    width: '100%', background: '#FFFFFF',
    border: '1px solid #E2E8F0', borderRadius: 8,
    padding: '8px 10px', fontSize: 13, color: '#0F172A', outline: 'none',
    fontFamily: " 'Montserrat', sans-serif",
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        .br-row:hover { background: rgba(0,200,150,0.03) !important; }
        .br-filter:hover { color: #334155 !important; }
        .br-back:hover { border-color: rgba(0,200,150,0.2) !important; color: #00C896 !important; }
        .br-modal-input:focus { border-color: rgba(0,200,150,0.35) !important; box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important; }
        .br-add-step:hover { border-color: rgba(0,200,150,0.3) !important; color: #00C896 !important; }
        .br-niche-btn:hover { border-color: rgba(0,200,150,0.35) !important; }
      `}</style>

      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: " 'Montserrat', sans-serif", color: '#0F172A' }}>

          {/* ── HEADER ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="br-back"
                onClick={() => navigate(-1)}
                style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 9, padding: '7px 9px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
              >
                <ArrowLeft size={15} />
              </button>
              <div>
                <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', letterSpacing: -0.5, margin: '0 0 3px' }}>
                  Régua de Cobrança
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  {config?.niche && <span style={{ color: '#64748B' }}>{config.niche.icon} {config.niche.name}</span>}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, color: config?.is_active ? '#00C896' : '#F5A623' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {config?.is_active ? 'Ativa' : 'Pausada'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {config?.is_active ? (
                <button onClick={() => handleToggleClick('pause')} disabled={togglingBilling} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', color: '#F5A623', borderRadius: 9, padding: '0.6rem 1rem', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                  <Pause size={13} /> Pausar
                </button>
              ) : (
                <button onClick={() => handleToggleClick('resume')} disabled={togglingBilling} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.25)', color: '#00C896', borderRadius: 9, padding: '0.6rem 1rem', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                  <Play size={13} /> Reativar
                </button>
              )}
              {/* <button onClick={openConfigModal} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818CF8', borderRadius: 9, padding: '0.6rem 1rem', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                <Settings size={13} /> Reconfigurar
              </button> */}
            </div>
          </div>

          {/* ── STAT CARDS ── */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem' }}>
              <StatCard label="Total" value={stats.total} color="#818CF8" icon={BarChart3} />
              <StatCard label="Enviados" value={stats.sent} color="#00C896" icon={CheckCircle2} sub={`${stats.success_rate}% sucesso`} />
              <StatCard label="Agendados" value={stats.scheduled} color="#818CF8" icon={Clock} />
              <StatCard label="Falharam" value={stats.failed} color="#E84545" icon={XCircle} />
            </div>
          )}

          {/* ── LAST / NEXT ── */}
          {stats && (stats.last_sent || stats.next_scheduled) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
              {stats.last_sent && (
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,200,150,0.12)', borderRadius: 12, padding: '1rem 1.15rem', display: 'flex', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Send size={14} color="#00C896" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#00C896', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Última enviada</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{stats.last_sent.subject}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{stats.last_sent.date}</div>
                  </div>
                </div>
              )}
              {stats.next_scheduled && (
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: '1rem 1.15rem', display: 'flex', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={14} color="#818CF8" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Próxima agendada</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{stats.next_scheduled.subject}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{stats.next_scheduled.date}</div>
                    <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, marginTop: 2 }}>Em {stats.next_scheduled.days_until} dias</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TIMELINE ── */}
          {uniqueOffsets.length > 0 && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '1.1rem 1.25rem' }}>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Fluxo configurado</div>
              <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 4 }}>
                {uniqueOffsets.map((offset, i) => (
                  <div key={offset} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 55 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: offset === 0 ? 'rgba(0,200,150,0.1)' : '#F8FAFC', border: `2px solid ${offset === 0 ? '#00C896' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: offset === 0 ? '#00C896' : '#94A3B8', fontFamily: "'Montserrat', sans-serif" }}>
                        {offset < 0 ? `D${offset}` : offset === 0 ? 'D0' : `D+${offset}`}
                      </div>
                      <div style={{ fontSize: 9, color: '#64748B', textAlign: 'center', lineHeight: 1.3 }}>
                        {offset < 0 ? 'Aviso' : offset === 0 ? 'Venc.' : 'Follow'}
                      </div>
                    </div>
                    {i < uniqueOffsets.length - 1 && (
                      <div style={{ height: 1, flex: 1, background: '#F1F5F9', marginBottom: 18, minWidth: 10 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FILTER + LIST ── */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            {/* Filters */}
            <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', overflowX: 'auto' }}>
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  className="br-filter"
                  onClick={() => setFilterStatus(opt.value)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '0.85rem 1rem', fontSize: 12, fontWeight: 700,
                    fontFamily: "'Montserrat', sans-serif",
                    color: filterStatus === opt.value ? '#00C896' : '#64748B',
                    borderBottom: `2px solid ${filterStatus === opt.value ? '#00C896' : 'transparent'}`,
                    marginBottom: -1, whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                  {opt.count > 0 && (
                    <span style={{ background: filterStatus === opt.value ? 'rgba(0,200,150,0.1)' : '#F1F5F9', color: filterStatus === opt.value ? '#00C896' : '#64748B', borderRadius: 100, padding: '1px 7px', fontSize: 10, fontWeight: 800 }}>
                      {opt.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredRules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                  <MessageCircle size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                  <p style={{ fontSize: 13, margin: '0 0 16px' }}>
                    {filterStatus === 'all' ? 'Nenhuma cobrança configurada' : `Nenhuma cobrança "${filterStatus}"`}
                  </p>
                  {filterStatus === 'all' && (
                    <button onClick={openConfigModal} style={{ background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.25)', color: '#00C896', borderRadius: 9, padding: '0.6rem 1.25rem', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                      Configurar régua
                    </button>
                  )}
                </div>
              ) : filteredRules.map((rule) => (
                <RuleCard key={rule.id} rule={rule} onResend={handleResend} onCancel={handleCancel} onUpdate={handleUpdateSingleRule} templates={templates} />
              ))}
            </div>
          </div>
        </div>

        {/* ── PAUSE/RESUME CONFIRMATION MODAL ── */}
        <Dialog open={showPauseConfirm} onOpenChange={setShowPauseConfirm}>
          <DialogContent style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 18, maxWidth: 420, padding: 0, overflow: 'hidden' }}>
            {/* Modal header */}
            <div style={{ background: pendingToggleAction === 'pause' ? 'rgba(245,158,11,0.06)' : 'rgba(0,200,150,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: pendingToggleAction === 'pause' ? 'rgba(245,158,11,0.15)' : 'rgba(0,200,150,0.15)', border: pendingToggleAction === 'pause' ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(0,200,150,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {pendingToggleAction === 'pause' ? <Pause size={16} color="#F5A623" /> : <Play size={16} color="#00C896" />}
              </div>
              <div>
                <DialogTitle style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {pendingToggleAction === 'pause' ? 'Pausar régua de cobrança?' : 'Reativar régua de cobrança?'}
                </DialogTitle>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, margin: 0, marginBottom: '1rem' }}>
                {pendingToggleAction === 'pause' 
                  ? 'Ao pausar a régua, nenhuma cobrança será enviada até que você a reative. As cobranças agendadas não serão processadas.'
                  : 'Ao reativar a régua, as cobranças agendadas voltarão a ser processadas normalmente.'}
              </p>
              <div style={{ background: pendingToggleAction === 'pause' ? 'rgba(245,158,11,0.05)' : 'rgba(0,200,150,0.05)', border: pendingToggleAction === 'pause' ? '1px solid rgba(245,158,11,0.12)' : '1px solid rgba(0,200,150,0.12)', borderRadius: 9, padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: 11, color: pendingToggleAction === 'pause' ? '#F5A623' : '#00C896', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={13} />
                  {pendingToggleAction === 'pause' ? 'Ação não pode ser desfeita automaticamente' : 'Você pode pausar novamente a qualquer momento'}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ borderTop: '1px solid #F1F5F9', padding: '1rem 1.5rem', display: 'flex', gap: 8, background: '#F8FAFC' }}>
              <button 
                onClick={() => setShowPauseConfirm(false)} 
                disabled={togglingBilling}
                style={{ flex: 1, background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#64748B', borderRadius: 8, padding: '0.65rem', fontSize: 13, fontWeight: 600, cursor: togglingBilling ? 'wait' : 'pointer', fontFamily: " 'Montserrat', sans-serif" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleToggleConfirm}
                disabled={togglingBilling}
                style={{ flex: 1, background: pendingToggleAction === 'pause' ? '#F5A623' : '#00C896', color: pendingToggleAction === 'pause' ? '#3D2817' : '#051A12', border: 'none', borderRadius: 8, padding: '0.65rem', fontSize: 13, fontWeight: 800, cursor: togglingBilling ? 'wait' : 'pointer', fontFamily: "'Montserrat', sans-serif", opacity: togglingBilling ? 0.65 : 1, transition: 'opacity 0.2s' }}
              >
                {togglingBilling ? 'Processando...' : (pendingToggleAction === 'pause' ? 'Pausar' : 'Reativar')}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── CONFIG MODAL ── */}
        <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
          <DialogContent style={{ background: '#0D1210', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, maxWidth: 600, padding: 0, overflow: 'hidden' }}>

            {/* Modal header */}
            <div style={{ background: 'rgba(99,102,241,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Settings size={16} color="#818CF8" />
              </div>
              <div>
                <DialogTitle style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1rem', fontWeight: 800, color: '#F0F5F2', margin: 0 }}>
                  Configurar régua
                </DialogTitle>
                <p style={{ fontSize: 11, color: '#5A7A70', margin: 0, marginTop: 2 }}>
                  Defina etapas: negativo = antes, 0 = no dia, positivo = após o vencimento
                </p>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', maxHeight: '58vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

              {/* Variables */}
              <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 9, padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: 10, color: '#818CF8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Variáveis disponíveis</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['{nome}', '{valor}', '{vencimento}', '{chave_pix}'].map((v) => (
                    <code key={v} style={{ background: 'rgba(255,255,255,0.05)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 5, padding: '2px 7px', fontSize: 11 }}>{v}</code>
                  ))}
                </div>
              </div>

              {/* Niches */}
              {niches.length > 0 && (
                <div style={{ background: 'rgba(0,200,150,0.04)', border: '1px solid rgba(0,200,150,0.12)', borderRadius: 10, padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: 10, color: '#00C896', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                    📋 Templates por nicho {loadingNiches && <span style={{ color: '#3A5A50', fontSize: 9 }}>(carregando…)</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                    {niches.map((niche) => (
                      <button
                        key={niche.id}
                        className="br-niche-btn"
                        onClick={() => applyNicheTemplates(niche)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                          padding: '0.75rem 0.5rem',
                          background: selectedNiche?.id === niche.id ? 'rgba(0,200,150,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${selectedNiche?.id === niche.id ? '#00C896' : 'rgba(255,255,255,0.07)'}`,
                          borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{niche.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#C0D5CC', textAlign: 'center' }}>{niche.name}</span>
                        <span style={{ fontSize: 10, color: '#3A5A50' }}>{niche.templates?.length ?? 0} templates</span>
                        {selectedNiche?.id === niche.id && <span style={{ fontSize: 9, color: '#00C896', fontWeight: 700 }}>✓ Selecionado</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps */}
              {customSteps
                .map((step, origIdx) => ({ step, origIdx }))
                .sort((a, b) => a.step.days_offset - b.step.days_offset)
                .map(({ step, origIdx }) => (
                  <div key={origIdx} style={{ background: '#111614', border: `1px solid ${editingStepIdx === origIdx ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                    {/* Step header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: step.days_offset < 0 ? 'rgba(245,158,11,0.08)' : step.days_offset === 0 ? 'rgba(0,200,150,0.1)' : 'rgba(232,69,69,0.08)', border: `1px solid ${step.days_offset < 0 ? 'rgba(245,158,11,0.2)' : step.days_offset === 0 ? 'rgba(0,200,150,0.2)' : 'rgba(232,69,69,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, fontFamily: "'Montserrat', sans-serif", color: step.days_offset < 0 ? '#F5A623' : step.days_offset === 0 ? '#00C896' : '#E84545' }}>
                        {step.days_offset < 0 ? `D${step.days_offset}` : step.days_offset === 0 ? 'D0' : `D+${step.days_offset}`}
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 11, color: '#5A7A70', fontWeight: 600, whiteSpace: 'nowrap' }}>Dias:</label>
                        <input
                          type="number"
                          value={step.days_offset}
                          onChange={(e) => updateStepOffset(origIdx, parseInt(e.target.value) || 0)}
                          className="br-modal-input"
                          style={{ width: 65, background: '#0D1210', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 8px', fontSize: 12, fontWeight: 700, color: '#F0F5F2', textAlign: 'center', outline: 'none', fontFamily: "'Montserrat', sans-serif" }}
                        />
                        <span style={{ fontSize: 11, color: '#4A6A60' }}>
                          {step.days_offset < 0 ? 'antes' : step.days_offset === 0 ? 'no dia' : 'após'} o vencimento
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          onClick={() => setEditingStepIdx(editingStepIdx === origIdx ? null : origIdx)}
                          style={{ background: editingStepIdx === origIdx ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${editingStepIdx === origIdx ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', color: editingStepIdx === origIdx ? '#818CF8' : '#5A7A70', fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {editingStepIdx === origIdx ? 'Fechar' : 'Editar'}
                        </button>
                        <button
                          onClick={() => removeStep(origIdx)}
                          disabled={customSteps.length <= 1}
                          style={{ background: 'rgba(232,69,69,0.07)', border: '1px solid rgba(232,69,69,0.15)', borderRadius: 6, padding: '4px 6px', cursor: customSteps.length <= 1 ? 'not-allowed' : 'pointer', color: '#E84545', opacity: customSteps.length <= 1 ? 0.3 : 1, display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded edit */}
                    {editingStepIdx === origIdx && (
                      <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: 0 }}>
                        {templates.length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            <label style={{ fontSize: 10, color: '#3A5A50', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 5 }}>Carregar de um template salvo</label>
                            <select
                              className="br-modal-input"
                              value={step.template_id || ""}
                              onChange={(e) => applyTemplateToStep(origIdx, e.target.value)}
                              style={{ ...modalInput, cursor: 'pointer', appearance: 'none', background: '#111614 url("data:image/svg+xml;utf8,<svg fill=\'%235A7A70\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>") no-repeat right 8px center' }}
                            >
                              <option value="">-- Texto manual --</option>
                              {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.title || t.subject}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div>
                          <label style={{ fontSize: 10, color: '#3A5A50', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 5 }}>Assunto</label>
                          <input
                            className="br-modal-input"
                            value={step.subject}
                            onChange={(e) => updateStepField(origIdx, 'subject', e.target.value)}
                            style={{ ...modalInput }}
                            disabled={!!step.template_id}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: '#3A5A50', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 5 }}>Mensagem</label>
                          <textarea
                            className="br-modal-input"
                            value={step.content}
                            onChange={(e) => updateStepField(origIdx, 'content', e.target.value)}
                            rows={5}
                            style={{ ...modalInput, resize: 'vertical', lineHeight: 1.65 }}
                            disabled={!!step.template_id}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {/* Add step */}
              <button
                className="br-add-step"
                onClick={addStep}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 9, padding: '0.75rem', cursor: 'pointer', color: '#4A6A60', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', fontFamily: " 'Montserrat', sans-serif" }}
              >
                <Plus size={13} /> Adicionar etapa
              </button>
            </div>

            {/* Modal footer */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.5rem', display: 'flex', gap: 8, background: 'rgba(255,255,255,0.01)' }}>
              <button onClick={() => setShowConfigModal(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#5A7A70', borderRadius: 8, padding: '0.65rem', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: " 'Montserrat', sans-serif" }}>
                Cancelar
              </button>
              <button
                onClick={handleCreateRules}
                disabled={creatingRules || customSteps.length === 0}
                style={{ flex: 2, background: '#00C896', color: '#051A12', border: 'none', borderRadius: 8, padding: '0.65rem', fontSize: 13, fontWeight: 800, cursor: creatingRules ? 'wait' : 'pointer', fontFamily: "'Montserrat', sans-serif", opacity: creatingRules || customSteps.length === 0 ? 0.65 : 1, transition: 'opacity 0.2s' }}
              >
                {creatingRules ? 'Criando…' : `Criar régua (${customSteps.length} etapa${customSteps.length !== 1 ? 's' : ''})`}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
