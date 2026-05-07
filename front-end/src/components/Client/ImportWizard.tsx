import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDropzone } from "react-dropzone";
import { useState, useCallback, useMemo } from "react";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { toast } from "react-toastify";
import { Client } from "@/api/models/clients";
import { Product } from "@/api/models/products";
import { AuthUser } from "@/api/models/auth";
import { mascaraTelefone } from "@/utils/mask";
import Cookies from "js-cookie";
import * as XLSX from "xlsx";
import {
  FileUp, FileText, Loader2, Check,
  AlertCircle, DollarSign, CalendarIcon, User,
  FileSearchIcon, Phone, Repeat, Hash,
  Table as TableIcon, Download, ChevronRight, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ─── BILLING DEFAULTS ────────────────────────────────────────────────────────
const DEFAULT_BILLING_STEPS = [
  { days_offset: -3, type: "pre_vencimento" },
  { days_offset: 0, type: "vencimento" },
  { days_offset: 3, type: "pos_vencimento" },
];

interface ExtractedData {
  amount?: number;
  totalAmount?: number;
  installments?: number;
  dueDate?: string;
  dueDates?: string[];
  clientName?: string;
  rawText?: string;
}

interface SpreadsheetRow {
  nome: string;
  telefone: string;
  email?: string;
  valor: number | string;
  vencimento: string;
  observacoes?: string;
  status?: "pending" | "success" | "error";
  errorMsg?: string;
}

export function ImportWizard({
  onSuccess,
  label = "Importar Clientes",
  variant = "outline",
  className = ""
}: {
  onSuccess?: () => void;
  label?: string;
  variant?: "outline" | "ghost" | "default";
  className?: string;
}) {
  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const [open, setOpen] = useState(false);
  const [importType, setImportType] = useState<"choice" | "ocr" | "spreadsheet">("choice");
  const [step, setStep] = useState<"upload" | "analyzing" | "review" | "importing">("upload");

  // OCR specific state
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [ocrForm, setOcrForm] = useState({
    name: "",
    phone: "",
    amount: 0,
    date: "",
    dueDay: 10,
    installments: 1,
    recurrence: "none" as "none" | "monthly"
  });

  // Spreadsheet specific state
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const resetState = () => {
    setImportType("choice");
    setStep("upload");
    setExtracted(null);
    setRows([]);
    setOcrForm({
      name: "",
      phone: "",
      amount: 0,
      date: "",
      dueDay: 10,
      installments: 1,
      recurrence: "none"
    });
    setImportProgress({ current: 0, total: 0 });
  };

  // ─── OCR LOGIC ─────────────────────────────────────────────────────────────

  const onDropOCR = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setStep("analyzing");
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append("document", file);

    try {
      const data = await fetchUseQuery<FormData, ExtractedData>({
        route: "/billing/ocr/analyze",
        method: "POST",
        data: formData
      });

      setExtracted(data);
      setOcrForm({
        name: data.clientName || "",
        amount: data.amount || 0,
        phone: "",
        date: data.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : "",
        dueDay: data.dueDate ? new Date(data.dueDate).getDate() : 10,
        installments: data.installments && data.installments > 1 ? data.installments : 1,
        recurrence: data.installments && data.installments > 1 ? "monthly" : "none"
      });
      setStep("review");
    } catch (error: any) {
      toast.error(error.message || "Falha na análise do documento");
      setStep("upload");
    }
  }, []);

  // ─── SPREADSHEET LOGIC ─────────────────────────────────────────────────────

  const onDropSpreadsheet = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet) as any[];

        const parsedRows: SpreadsheetRow[] = json.map((row: any) => ({
          nome: row.Nome || row.nome || "",
          telefone: String(row.Telefone || row.telefone || "").replace(/\D/g, ""),
          email: row.Email || row.email || "",
          valor: row.Valor || row.valor || 0,
          vencimento: row.Vencimento || row.vencimento || "",
          observacoes: row.Observações || row.Observacoes || row.observacoes || "",
          status: "pending"
        }));

        if (parsedRows.length === 0) {
          toast.error("A planilha parece estar vazia ou com cabeçalhos incorretos.");
          return;
        }

        setRows(parsedRows);
        setStep("review");
      } catch (err) {
        toast.error("Erro ao ler planilha. Verifique o formato.");
      }
    };

    reader.readAsBinaryString(file);
  }, []);

  const downloadTemplate = () => {
    const headers = ["Nome", "Telefone", "Email", "Valor", "Vencimento", "Observações"];
    const example = ["João Silva", "11999998888", "joao@email.com", "150.00", "10/05/2026", "Mensalidade"];

    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "modelo_importacao_cobr_cobrancas.xlsx");
  };

  const { getRootProps: getRootPropsOCR, getInputProps: getInputPropsOCR } = useDropzone({
    onDrop: onDropOCR,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const { getRootProps: getRootPropsXLS, getInputProps: getInputPropsXLS } = useDropzone({
    onDrop: onDropSpreadsheet,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"]
    },
    multiple: false,
  });

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  const getNextDueDate = (day: number): string => {
    const now = new Date();
    let target = new Date(now.getFullYear(), now.getMonth(), day);
    if (target <= now) target.setMonth(target.getMonth() + 1);
    return target.toISOString();
  };

  const createClientFlow = async (data: {
    name: string,
    phone: string,
    email?: string,
    amount: number,
    dueDate: string,
    recurrence: "none" | "monthly",
    observacoes?: string
  }) => {
    // 1. Criar produto
    const newProduct = await fetchUseQuery<Record<string, unknown>, Product>({
      route: "/products",
      method: "POST",
      data: {
        name: `Serviço - ${data.name}`,
        value: data.amount,
        description: data.observacoes || `Importado via ${importType.toUpperCase()}`,
        user_id: parsedUser?.id,
      },
    });

    // 2. Criar o cliente
    const payload: Record<string, unknown> = {
      name: data.name,
      phone: data.phone.replace(/\D/g, ""),
      email: data.email || undefined,
      due_at: data.dueDate,
      user_id: parsedUser?.id,
      product_id: newProduct.id,
      preferred_channels: ["whatsapp"],
      observacoes1: data.observacoes || undefined
    };

    const newClient = await fetchUseQuery<typeof payload, Client>({
      route: "/clients",
      method: "POST",
      data: payload,
    });

    // 3. Criar régua
    if (newClient?.id) {
      await fetchUseQuery<any, any>({
        route: `/billing/rules/${newClient.id}`,
        method: "POST",
        data: {
          useDefaultTemplates: false,
          recurrence: data.recurrence,
          templates: DEFAULT_BILLING_STEPS.map(s => ({
            type: s.type,
            days_offset: s.days_offset,
            subject: s.days_offset < 0 ? "Lembrete - {nome}" : s.days_offset === 0 ? "Vencimento - {nome}" : "Atraso - {nome}",
            content: s.days_offset < 0
              ? "Olá, {nome}! 👋 Seu pagamento de {valor} vence em {vencimento}.\n🔗 {link_pagamento}"
              : s.days_offset === 0
                ? "Olá, {nome}! 📅 Hoje vence seu pagamento de {valor}.\n🔗 {link_pagamento}"
                : "Olá, {nome}! ⚠️ Seu pagamento de {valor} está em atraso.\n🔗 {link_pagamento}",
          })),
        },
      });
    }
    return newClient;
  };

  const handleConfirmOCR = async () => {
    setStep("importing");
    try {
      await createClientFlow({
        name: ocrForm.name,
        phone: ocrForm.phone,
        amount: ocrForm.amount,
        dueDate: ocrForm.recurrence === "monthly" ? getNextDueDate(ocrForm.dueDay) : new Date(ocrForm.date).toISOString(),
        recurrence: ocrForm.recurrence,
        observacoes: extracted?.rawText ? "Extraído via OCR" : undefined
      });
      toast.success("Cliente importado com sucesso!");
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      handleErrorMessages(error.errors || [{ message: "Erro ao importar" }]);
      setStep("review");
    }
  };

  const handleConfirmSpreadsheet = async () => {
    setStep("importing");
    setImportProgress({ current: 0, total: rows.length });

    let successCount = 0;
    const updatedRows = [...rows];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Simple date parsing for DD/MM/YYYY
        let dateObj: Date;
        if (row.vencimento instanceof Date) {
          dateObj = row.vencimento;
        } else {
          const parts = String(row.vencimento).split("/");
          if (parts.length === 3) {
            dateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          } else {
            dateObj = new Date(row.vencimento);
          }
        }

        await createClientFlow({
          name: row.nome,
          phone: row.telefone,
          email: row.email,
          amount: Number(String(row.valor).replace(",", ".")),
          dueDate: isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString(),
          recurrence: "none",
          observacoes: row.observacoes
        });

        successCount++;
        updatedRows[i].status = "success";
      } catch (err: any) {
        updatedRows[i].status = "error";
        updatedRows[i].errorMsg = err.message || "Erro";
      }
      setImportProgress(p => ({ ...p, current: i + 1 }));
      setRows([...updatedRows]);
    }

    if (successCount === rows.length) {
      toast.success(`${successCount} clientes importados com sucesso!`);
      setOpen(false);
      if (onSuccess) onSuccess();
    } else {
      toast.warning(`${successCount} de ${rows.length} clientes importados. Verifique os erros.`);
      setStep("review");
    }
  };

  // ─── RENDERING ─────────────────────────────────────────────────────────────

  return (
    <div className="iw">
      <Dialog open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val)
            resetState();
        }}>
        <DialogTrigger asChild>
          <Button variant={variant} className={`gap-2 ${className}`}>
            <FileUp size={14} /> {label}
          </Button>
        </DialogTrigger>

        <DialogContent 
          className="p-0 overflow-hidden transition-all duration-300 sm:max-w-[480px]"
          style={{ background: "var(--bg2, #FFFFFF)", border: "1px solid var(--border, #E2E8F0)", borderRadius: "24px" }}
        >
          <DialogHeader className="p-6 pb-2">
            <DialogTitle style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text, #0F172A)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              {importType === "choice" ? (
                <><FileUp style={{ color: "var(--cobr, #00C896)" }} size={20} /> Importar Clientes</>
              ) : importType === "ocr" ? (
                <><FileSearchIcon style={{ color: "var(--cobr, #00C896)" }} size={20} /> Importar Contrato (PDF)</>
              ) : (
                <><TableIcon style={{ color: "var(--cobr, #00C896)" }} size={20} /> Importar Planilha</>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 pt-2">
            {/* ── CHOICE STEP ── */}
            {importType === "choice" && (
              <div className="grid grid-cols-1 gap-4 py-4">
                <button
                  onClick={() => { setImportType("ocr"); setStep("upload"); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem", width: "100%", padding: "1.5rem",
                    background: "var(--bg, #F8FAFC)", border: "1px solid var(--border, #E2E8F0)", borderRadius: "16px",
                    textAlign: "left", cursor: "pointer", transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--cobr, #00C896)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border, #E2E8F0)"; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(0,200,150,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--cobr)" }}>
                    <FileSearchIcon size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: "var(--text, #0F172A)", fontSize: "1rem", fontWeight: 700, margin: "0 0 4px" }}>Contrato Individual (PDF)</h3>
                    <p style={{ color: "var(--text2, #64748B)", fontSize: "0.75rem", margin: 0, lineHeight: 1.4 }}>Extraímos nome, valor e vencimento via OCR automaticamente.</p>
                  </div>
                  <ChevronRight color="var(--text2, #64748B)" size={20} />
                </button>

                <button
                  onClick={() => { setImportType("spreadsheet"); setStep("upload"); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem", width: "100%", padding: "1.5rem",
                    background: "var(--bg, #F8FAFC)", border: "1px solid var(--border, #E2E8F0)", borderRadius: "16px",
                    textAlign: "left", cursor: "pointer", transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border, #E2E8F0)"; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
                    <TableIcon size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: "var(--text, #0F172A)", fontSize: "1rem", fontWeight: 700, margin: "0 0 4px" }}>Massa de Clientes (Excel/CSV)</h3>
                    <p style={{ color: "var(--text2, #64748B)", fontSize: "0.75rem", margin: 0, lineHeight: 1.4 }}>Suba centenas de clientes de uma vez usando nosso modelo padrão.</p>
                  </div>
                  <ChevronRight color="var(--text2, #64748B)" size={20} />
                </button>
              </div>
            )}

            {/* ── UPLOAD STEP ── */}
            {importType !== "choice" && step === "upload" && (
              <div className="space-y-4">
                <button 
                  onClick={() => setImportType("choice")} 
                  style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text2, #64748B)", fontSize: "0.75rem", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "0.5rem" }}
                >
                  <ArrowLeft size={14} /> Voltar para opções
                </button>

                <div
                  {...(importType === "ocr" ? getRootPropsOCR() : getRootPropsXLS())}
                  style={{ border: "2px dashed var(--border, #E2E8F0)", borderRadius: "16px", padding: "3rem", textAlign: "center", cursor: "pointer", background: "var(--bg, #F8FAFC)" }}
                >
                  <input {...(importType === "ocr" ? getInputPropsOCR() : getInputPropsXLS())} />
                  <div style={{ width: 64, height: 64, background: "var(--bg2, #FFFFFF)", border: "1px solid var(--border, #E2E8F0)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                    <FileUp color="var(--text2, #64748B)" size={28} />
                  </div>
                  <h3 style={{ color: "var(--text, #0F172A)", fontSize: "1rem", fontWeight: 700, margin: "0 0 4px" }}>
                    Arraste seu arquivo {importType === "ocr" ? ".pdf" : ".xlsx ou .csv"} aqui
                  </h3>
                  <p style={{ color: "var(--text2, #64748B)", fontSize: "0.75rem", margin: 0 }}>Ou clique para selecionar em seu computador</p>
                </div>

                {importType === "spreadsheet" && (
                  <button
                    onClick={downloadTemplate}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border, #E2E8F0)", background: "var(--bg2, #FFFFFF)", color: "var(--cobr, #00C896)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    <Download size={14} /> Baixar Planilha Modelo
                  </button>
                )}
              </div>
            )}

            {/* ── ANALYZING / IMPORTING ── */}
            {(step === "analyzing" || step === "importing") && (
              <div className="py-12 text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-[var(--border)] rounded-full"></div>
                  <div
                    className="absolute inset-0 border-4 rounded-full animate-spin"
                    style={{ borderColor: "var(--cobr)", borderTopColor: "transparent", animationDuration: '0.8s' }}
                  ></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {step === "importing" && importProgress.total > 0 ? (
                      <span style={{ color: "var(--cobr)", fontWeight: 800, fontSize: "1.125rem" }}>{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                    ) : (
                      <Loader2 color="var(--cobr)" className="animate-spin" size={24} />
                    )}
                  </div>
                </div>
                <h3 style={{ color: "var(--text, #0F172A)", fontSize: "1rem", fontWeight: 700, margin: "0 0 4px" }}>
                  {step === "analyzing" ? "Analisando Documento..." : "Importando Clientes..."}
                </h3>
                <p style={{ color: "var(--text2, #64748B)", fontSize: "0.75rem", margin: 0 }}>
                  {step === "importing" && importProgress.total > 0
                    ? `Processando ${importProgress.current} de ${importProgress.total} registros`
                    : "Por favor, aguarde um momento."}
                </p>
              </div>
            )}

            {/* ── REVIEW OCR ── */}
            {importType === "ocr" && step === "review" && (
              <div className="space-y-4">
                <div style={{ background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: "12px", padding: "0.75rem", display: "flex", gap: "12px", alignItems: "center" }}>
                  <Check color="var(--cobr, #00C896)" size={16} />
                  <p style={{ color: "var(--text, #0F172A)", fontSize: "0.75rem", fontWeight: 600, margin: 0 }}>Leitura do contrato concluída com sucesso!</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text2, #64748B)", textTransform: "uppercase" }}>Nome do Cliente</label>
                    <Input value={ocrForm.name} onChange={(e) => setOcrForm({ ...ocrForm, name: e.target.value })} style={{ background: "var(--bg, #F8FAFC)", borderColor: "var(--border, #E2E8F0)", color: "var(--text, #0F172A)" }} />
                  </div>
                  <div className="space-y-1.5">
                    <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text2, #64748B)", textTransform: "uppercase" }}>Telefone (WhatsApp)</label>
                    <Input value={ocrForm.phone} onChange={(e) => setOcrForm({ ...ocrForm, phone: mascaraTelefone(e.target.value) })} placeholder="(00) 00000-0000" style={{ background: "var(--bg, #F8FAFC)", borderColor: "var(--border, #E2E8F0)", color: "var(--text, #0F172A)" }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text2, #64748B)", textTransform: "uppercase" }}>Valor</label>
                      <Input type="number" value={ocrForm.amount} onChange={(e) => setOcrForm({ ...ocrForm, amount: Number(e.target.value) })} style={{ background: "var(--bg, #F8FAFC)", borderColor: "var(--border, #E2E8F0)", color: "var(--text, #0F172A)" }} />
                    </div>
                    <div className="space-y-1.5">
                      <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text2, #64748B)", textTransform: "uppercase" }}>Vencimento</label>
                      <Input type="date" value={ocrForm.date} onChange={(e) => setOcrForm({ ...ocrForm, date: e.target.value })} style={{ background: "var(--bg, #F8FAFC)", borderColor: "var(--border, #E2E8F0)", color: "var(--text, #0F172A)" }} />
                    </div>
                  </div>
                </div>

                <Button onClick={handleConfirmOCR} style={{ width: "100%", background: "var(--cobr, #00C896)", color: "#fff", fontWeight: 800, borderRadius: "10px", padding: "1rem" }}>
                  Confirmar e Criar Cobrança
                </Button>
              </div>
            )}

            {/* ── REVIEW SPREADSHEET ── */}
            {importType === "spreadsheet" && step === "review" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div style={{ background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: "12px", padding: "0.75rem", display: "flex", gap: "12px", alignItems: "center" }}>
                    <TableIcon color="var(--cobr, #00C896)" size={16} />
                    <p style={{ color: "var(--text, #0F172A)", fontSize: "0.75rem", margin: 0 }}>Detectamos <strong style={{ fontWeight: 800 }}>{rows.length} clientes</strong> na sua planilha.</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep("upload")} style={{ color: "var(--text2, #64748B)", fontSize: "0.75rem" }}>Trocar arquivo</Button>
                </div>

                <div style={{ border: "1px solid var(--border, #E2E8F0)", borderRadius: "12px", overflow: "hidden", maxHeight: "300px", overflowY: "auto", background: "var(--bg, #F8FAFC)" }}>
                  <Table>
                    <TableHeader style={{ background: "var(--bg2, #FFFFFF)" }}>
                      <TableRow style={{ borderBottom: "1px solid var(--border, #E2E8F0)" }}>
                        <TableHead style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text2, #64748B)", textTransform: "uppercase" }}>Cliente</TableHead>
                        <TableHead style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text2, #64748B)", textTransform: "uppercase" }}>Telefone</TableHead>
                        <TableHead style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text2, #64748B)", textTransform: "uppercase" }}>Valor</TableHead>
                        <TableHead style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text2, #64748B)", textTransform: "uppercase" }}>Vencimento</TableHead>
                        <TableHead style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text2, #64748B)", textTransform: "uppercase" }}>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, i) => (
                        <TableRow key={i} style={{ borderBottom: "1px solid var(--border, #E2E8F0)" }}>
                          <TableCell style={{ fontSize: "0.75rem", color: "var(--text, #0F172A)", padding: "0.5rem" }}>{row.nome}</TableCell>
                          <TableCell style={{ fontSize: "0.75rem", color: "var(--text2, #64748B)", padding: "0.5rem" }}>{row.telefone}</TableCell>
                          <TableCell style={{ fontSize: "0.75rem", color: "var(--cobr, #00C896)", padding: "0.5rem", fontWeight: 800 }}>R$ {Number(String(row.valor).replace(",", ".")).toFixed(2)}</TableCell>
                          <TableCell style={{ fontSize: "0.75rem", color: "var(--text2, #64748B)", padding: "0.5rem" }}>{row.vencimento instanceof Date ? row.vencimento.toLocaleDateString() : row.vencimento}</TableCell>
                          <TableCell style={{ padding: "0.5rem" }}>
                            {row.status === "pending" ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} /> :
                              row.status === "success" ? <Check color="var(--cobr)" size={14} /> :
                                <AlertCircle color="#ef4444" size={14} title={row.errorMsg} />}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="pt-2">
                  <Button onClick={handleConfirmSpreadsheet} style={{ width: "100%", background: "var(--cobr, #00C896)", color: "#fff", fontWeight: 800, borderRadius: "10px", padding: "1rem" }}>
                    Importar {rows.length} Clientes Agora
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
