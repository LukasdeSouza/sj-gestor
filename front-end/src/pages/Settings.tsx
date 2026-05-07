import DashboardLayout from "@/components/DashboardLayout";
import { WhatsAppContent } from "./WhatsApp";
import { ProductsContent } from "./Products";
import { TemplatesContent } from "./Templates";
import { useSearchParams } from "react-router-dom";
import { MessageCircle, FileText, Package } from "lucide-react";

const TABS = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "templates", label: "Templates", icon: FileText },
  { value: "produtos", label: "Produtos", icon: Package },
];

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "whatsapp";

  function handleTabChange(value: string) {
    setSearchParams({ tab: value });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        .st-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family:  "Montserrat", sans-serif;
          color: #0F172A;
        }

        /* ── header ── */
        .st-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.6px;
          margin: 0 0 3px;
        }
        .st-sub {
          font-size: 0.82rem;
          color: #64748B;
          margin: 0;
        }

        /* ── tab bar ── */
        .st-tabs {
          display: flex;
          gap: 4px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 4px;
          width: fit-content;
        }
        .st-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0.52rem 1rem;
          border-radius: 7px;
          border: 1px solid transparent;
          background: transparent;
          color: #64748B;
          font-size: 0.8rem;
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
          cursor: pointer;
          transition: color 0.15s, background 0.15s, border-color 0.15s;
          white-space: nowrap;
        }
        .st-tab:hover {
          color: #0F172A;
          background: #F8FAFC;
        }
        .st-tab.active {
          background: rgba(0,200,150,0.1);
          color: #00C896;
          border-color: rgba(0,200,150,0.2);
        }
        .st-tab svg {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        /* ── content panel ── */
        .st-panel {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          overflow: hidden;
        }

        /* responsive */
        @media (max-width: 640px) {
          .st-tabs { width: 100%; overflow-x: auto; }
          .st-tab  { padding: 0.5rem 0.75rem; font-size: 0.75rem; }
        }
      `}</style>

      <DashboardLayout>
        <div className="st-page">

          {/* ── PAGE HEADER ── */}
          <div>
            <h1 className="st-title">Configurações</h1>
            <p className="st-sub">Gerencie suas integrações e preferências.</p>
          </div>

          {/* ── TAB BAR ── */}
          <div className="st-tabs" role="tablist">
            {TABS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                role="tab"
                aria-selected={activeTab === value}
                className={`st-tab${activeTab === value ? " active" : ""}`}
                onClick={() => handleTabChange(value)}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>

          {/* ── TAB CONTENT ── */}
          <div className="st-panel">
            {activeTab === "whatsapp" && <WhatsAppContent />}
            {activeTab === "templates" && <TemplatesContent />}
            {activeTab === "produtos" && <ProductsContent />}
          </div>

        </div>
      </DashboardLayout>
    </>
  );
}
