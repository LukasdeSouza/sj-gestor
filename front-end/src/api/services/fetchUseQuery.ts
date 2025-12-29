import { AUTH_REDIRECT_PATH, TOKEN_COOKIE_KEY, USER_COOKIE_KEY } from "@/constants/auth";
import { createURLSearch } from "../../utils/createURLSearch";
import { FetchApiProps } from "../../types/api";
import Cookies from "js-cookie";

const handleAuthInvalidation = () => {
  Cookies.remove(TOKEN_COOKIE_KEY);
  Cookies.remove(USER_COOKIE_KEY);

  if (typeof window !== "undefined") {
    window.location.href = AUTH_REDIRECT_PATH;
  }
};

export const getApiUrlEnv = () => {
  if (typeof window !== "undefined") {
    return import.meta.env.VITE_PUBLIC_API_URL;
  } else {
    return import.meta.env.VITE_API_URL;
  }
};

export interface ApiErrorQuery {
  message: string;
  errors: string[];
  code: number;
}

export async function fetchUseQuery<RequestData extends Record<string, unknown> | FormData, ResponseData>({
  route,
  method,
  data,
  token
}: FetchApiProps<RequestData | FormData>): Promise<ResponseData> {

  let bearerToken = token || undefined;

  if (!bearerToken) {
    bearerToken = Cookies.get(TOKEN_COOKIE_KEY);
  }

  const urlApi = getApiUrlEnv();
  let body: BodyInit | null = null;

  // Se for GET, transformar os parâmetros em query string
  if (method === "GET" && data) {
    let urlSearch;
    if (!(data instanceof FormData)) {
      urlSearch = createURLSearch({ route: route, data: { querys: data } });
      route = urlSearch || route;
    }
    route = urlSearch || route;
    body = null;
  } else if (method !== "GET" && data) {
    // Verifica se o dado é um FormData ou JSON
    body = data instanceof FormData ? data : JSON.stringify(data);
  }

  // Headers padrão
  const headers: HeadersInit = {
    accept: "application/json",
  };

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  // Apenas adiciona "Content-Type" se NÃO for FormData
  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${urlApi}${route}`, {
    method: method,
    headers: headers,
    body: body,
  });

  const json = await response.json().catch(() => ({}));

  if (response.status === 401 || response.status === 498) {
    handleAuthInvalidation();
    throw {
      message: json.message || "Sessão expirada",
      errors: json.errors || [],
      code: response.status,
    } as ApiErrorQuery;
  }

  if (!response.ok || json.error) {
    const error: ApiErrorQuery = {
      message: json.message || "Erro desconhecido",
      errors: json.errors || [],
      code: response.status,
    };
    throw error;
  }

  // Agora retornamos apenas os dados da API diretamente
  return json.data as ResponseData;
}
