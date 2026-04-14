import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SkeletonInformation from "@/components/Skeletons/SkeletonInformation";
import { PopupCreateProduct } from "@/components/Product/PopUpCreateProduct";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { PopupAlterProduct } from "@/components/Product/PopUpAlterProduct";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useMutation, useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { ProductsResponse } from "@/api/models/products";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Trash2, Search, Package, AlertCircle } from "lucide-react";
import { AuthUser } from "@/api/models/auth";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

export function ProductsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["subscription", "me"],
    queryFn: async () =>
      fetchUseQuery<undefined, { plan_id: string; status: string; pix_qr_code?: string; approved_at?: string }>({
        route: "/subscription/me", method: "GET",
      }),
    retry: 0,
  });

  const { data: dataProducts, isLoading: isloadingProducts, isFetching, refetch } = useQuery<ProductsResponse>({
    queryKey: ["listProducts", parsedUser?.id, debouncedSearch, page, limit],
    queryFn: async () =>
      fetchUseQuery<{ user_id: string; name?: string; page: number; limit: number }, ProductsResponse>({
        route: "/products", method: "GET",
        data: { user_id: parsedUser.id, name: debouncedSearch || undefined, page, limit },
      }),
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!parsedUser?.id,
  });

  const totalPages  = useMemo(() => dataProducts?.totalPaginas ?? 1, [dataProducts]);
  const currentPage = useMemo(() => dataProducts?.pagina ?? page, [dataProducts, page]);
  const products    = dataProducts?.products ?? [];

  // ── plan limits ───────────────────────────────────────────────────────────
  const isPixSubscription   = !!subscription?.pix_qr_code;
  const isApproved          = !!subscription?.approved_at;
  const isPlanEffective     = subscription?.status === "ACTIVE" && (!isPixSubscription || isApproved);
  const effectivePlanId     = isPlanEffective ? subscription?.plan_id : "FREE";
  const productLimit        = effectivePlanId === "FREE" ? 5 : Infinity;
  const currentProductsCount = dataProducts?.resultados || 0;
  const canAddProduct       = currentProductsCount < productLimit;
  const limitMessage        = !isApproved && isPixSubscription && subscription?.status === "ACTIVE"
    ? "Seu plano aguarda aprovação do pagamento para liberar mais produtos."
    : "Limite de produtos atingido. Faça um upgrade para adicionar mais.";

  const { mutate: dataDelete, isPending: isloadingDataDelete } = useMutation({
    mutationFn: async (id: string) =>
      fetchUseQuery({ route: `/products/${id}`, method: "DELETE" }),
    onSuccess: () => { toast.success("Deletado com sucesso!"); refetch(); },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) handleErrorMessages(error.errors);
    },
  });

  if (isloadingProducts || isLoadingSubscription) return <SkeletonInformation />;

  // ── styles ────────────────────────────────────────────────────────────────
  const pgBtn = (disabled: boolean): React.CSSProperties => ({
    background: "transparent",
    border: `1px solid ${disabled ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)"}`,
    color: disabled ? "#2A4A40" : "#5A7A70",
    borderRadius: 8, padding: "5px 12px", fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.15s, color 0.15s",
  });

  const btnDel: React.CSSProperties = {
    background: "none", border: "1px solid rgba(255,255,255,0.07)",
    color: "#3A5A50", borderRadius: 7, padding: "5px 7px",
    cursor: "pointer", display: "inline-flex", alignItems: "center",
    transition: "border-color 0.15s, color 0.15s",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        .prod-search:focus  { border-color: rgba(0,200,150,0.35) !important; box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important; outline: none !important; }
        .prod-search::placeholder { color: #2A4A40; }
        .prod-row           { transition: background 0.15s; cursor: default; }
        .prod-row:hover     { background: rgba(0,200,150,0.03) !important; }
        .prod-del:hover     { border-color: rgba(232,69,69,0.3) !important; color: #E84545 !important; }
        .prod-pg-btn:hover:not(:disabled) { border-color: rgba(0,200,150,0.3) !important; color: #00C896 !important; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "1.75rem", fontFamily: "'DM Sans', sans-serif", color: "#F0F5F2" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.3rem", fontWeight: 800, color: "#F0F5F2", letterSpacing: -0.5, margin: "0 0 3px" }}>
              Produtos
            </h1>
            <p style={{ fontSize: "0.8rem", color: "#5A7A70", margin: 0 }}>
              {currentProductsCount > 0
                ? `${currentProductsCount} produto${currentProductsCount !== 1 ? "s" : ""} cadastrado${currentProductsCount !== 1 ? "s" : ""}`
                : "Nenhum produto cadastrado ainda"}
              {effectivePlanId === "FREE" && (
                <span style={{ color: "#3A5A50", marginLeft: 6 }}>
                  · {currentProductsCount}/{productLimit} do plano gratuito
                </span>
              )}
            </p>
          </div>

          {/* plan limit banner */}
          {!canAddProduct && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)",
              borderRadius: 9, padding: "0.5rem 0.9rem",
              fontSize: 12, color: "#D4A020", maxWidth: 280,
            }}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              <span>{limitMessage}</span>
            </div>
          )}

          {canAddProduct ? (
            <PopupCreateProduct onSuccess={() => refetch()} />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <button
                    style={{
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "#3A5A50", borderRadius: 8, padding: "0.6rem 1.1rem",
                      fontFamily: "'Syne', sans-serif", fontSize: "0.82rem", fontWeight: 700,
                      cursor: "not-allowed", opacity: 0.5,
                    }}
                    onClick={() => toast.error(limitMessage)}
                  >
                    Novo Produto
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p style={{ maxWidth: 220, textAlign: "center", fontSize: 12 }}>{limitMessage}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* ── SEARCH ── */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#3A5A50", pointerEvents: "none" }}>
            <Search size={14} />
          </span>
          <input
            className="prod-search"
            style={{
              width: "100%", background: "#111614",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8,
              padding: "0.55rem 0.85rem 0.55rem 2.2rem",
              color: "#F0F5F2", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            }}
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* ── TABLE ── */}
        <div style={{ background: "#111614", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <Table>
            <TableHeader>
              <TableRow style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <TableHead style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "#3A5A50", paddingLeft: 20 }}>
                  Nome
                </TableHead>
                <TableHead style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "#3A5A50" }}>
                  Descrição
                </TableHead>
                <TableHead style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "#3A5A50" }}>
                  Valor
                </TableHead>
                <TableHead style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "#3A5A50", textAlign: "right", paddingRight: 20 }}>
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#3A5A50" }}>
                      <Package size={28} style={{ margin: "0 auto 10px", display: "block", opacity: 0.35 }} />
                      <p style={{ fontSize: 13, margin: 0 }}>
                        {searchTerm ? "Nenhum produto encontrado para esta busca." : "Nenhum produto cadastrado ainda."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.map((product) => (
                <TableRow
                  key={product.id}
                  className="prod-row"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  {/* Nome */}
                  <TableCell style={{ paddingLeft: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Package size={13} color="#00C896" />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#C0D5CC" }}>
                        {product.name}
                      </span>
                    </div>
                  </TableCell>

                  {/* Descrição */}
                  <TableCell>
                    <span style={{ fontSize: 13, color: "#5A7A70" }}>
                      {product.description || "—"}
                    </span>
                  </TableCell>

                  {/* Valor */}
                  <TableCell>
                    <span style={{
                      fontFamily: "'Syne', sans-serif", fontSize: 13,
                      fontWeight: 700, color: "#00C896",
                    }}>
                      {product.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </TableCell>

                  {/* Ações */}
                  <TableCell style={{ textAlign: "right", paddingRight: 20 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                      <PopupAlterProduct id={product.id} onSuccess={() => refetch()} />
                      <button
                        className="prod-del"
                        style={btnDel}
                        onClick={() => dataDelete(product.id)}
                        disabled={isloadingDataDelete}
                        title="Remover produto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 12, color: "#3A5A50" }}>
              Página {currentPage} de {totalPages}
              {currentProductsCount > 0 && ` · ${currentProductsCount} total`}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="prod-pg-btn"
                style={pgBtn(currentPage <= 1 || isFetching)}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isFetching}
              >
                Anterior
              </button>
              <button
                className="prod-pg-btn"
                style={pgBtn(currentPage >= totalPages || isFetching)}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isFetching}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default function Products() {
  return (
    <DashboardLayout>
      <ProductsContent />
    </DashboardLayout>
  );
}