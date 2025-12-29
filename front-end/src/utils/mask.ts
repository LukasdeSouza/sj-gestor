/** Máscara para formatar a data tanto se for com hora e dia ou só se for apenas a data ano mês e dia
 *  @param {Date | string} data
 *  @param {boolean} exibirSegundos - Se for verdadeiro, exibe os segundos
 *  @returns {string | undefined}
 */
export const formatarData = (data: Date | string, exibirSegundos: boolean = false): string | undefined => {
  if (!data) return undefined;

  if (typeof data === "string") {
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const [ano, mes, dia] = data.split("-");
      return `${dia}/${mes}/${ano}`;
    }

    // YYYY-MM-DDTHH:MM:...
    data = new Date(data);
  }

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const horas = String(data.getHours()).padStart(2, '0');
  const minutos = String(data.getMinutes()).padStart(2, '0');
  const segundos = String(data.getSeconds()).padStart(2, '0');

  return `${dia}/${mes}/${ano} às ${horas}:${minutos}${exibirSegundos ? ":" + segundos : ""}`;
};

/**
 * Formata um intervalo de datas no formato "Mmm/AAAA a Mmm/AAAA".
 * @param dataInicio - Data de início (Date, string ou timestamp).
 * @param dataFim - Data de fim (Date, string ou timestamp).
 * @param opcoes - Configurações opcionais: { separador: string, mesMaiusculo: boolean }.
 * @returns String formatada ou null se datas forem inválidas.
 */
export function formatarIntervaloDeDatas(
  dataInicio: Date | string | number,
  dataFim: Date | string | number,
  opcoes?: { separador?: string; mesMaiusculo?: boolean }
): string | null {
  // Configurações padrão
  const { separador = " a ", mesMaiusculo = true } = opcoes || {};

  // Converte para Date (se for string ou timestamp)
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  // Formata cada data
  const formatarData = (data: Date) => {
    let mes = data.toLocaleString("pt-BR", { month: "short" });
    mes = mes.replace('.', '');

    const ano = data.getFullYear();
    const mesFormatado = mesMaiusculo
      ? mes.charAt(0).toUpperCase() + mes.slice(1)
      : mes;

    return `${mesFormatado}/${ano}`;
  };

  // Retorna o intervalo formatado
  return `${formatarData(inicio)}${separador}${formatarData(fim)}`;
}

/**
 * Calcula o tempo que leva em relação à data atual
 * ex: x segundos, x minutos, x horas, x dias ou a data formatada ex: 01/01/2021 quando passar de 1 semana
 * @param {Date | string} data
 * @param {boolean} fallbackDataSemana
 * @returns {string | undefined}
 */

export const formatarDataEscrita = (data: Date | string): string | undefined => {
  if (data) {
    return new Date(data).toLocaleString('pt-BR', {
      timeZone: 'UTC',
      // weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

export const formatarDataEscritaCincoNegativo = (data: Date | string): string | undefined => {
  if (!data) {
    return undefined;
  }

  // Converte a entrada para um objeto Date.
  const date = typeof data === "string" ? new Date(data) : data;

  // Verifica se a data é válida.
  if (isNaN(date.getTime())) {
    return undefined;
  }

  // Subtrai 5 horas da data atual para obter o fuso horário desejado.
  date.setHours(date.getHours() - 5);

  // Formata a data ajustada com as opções de localização.
  // Usando 'UTC' aqui é ideal para evitar que o fuso local bagunce o resultado.
  return date.toLocaleString('pt-BR', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Terça-feira, 20 de maio de 2025
export const formatarDataEscritaUTC = (data: Date | string): string | undefined => {
  if (data) {
    // Formata a data usando toLocaleString
    const dataFormatada = new Date(data).toLocaleString('pt-BR', {
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Função auxiliar para capitalizar apenas a primeira palavra
    const capitalizarPrimeiraPalavra = (texto: string): string => {
      if (!texto) return texto;

      const [primeiraPalavra, ...resto] = texto.split(' '); // Divide o texto na primeira palavra e no resto
      const primeiraPalavraCapitalizada = primeiraPalavra.charAt(0).toUpperCase() + primeiraPalavra.slice(1);
      return [primeiraPalavraCapitalizada, ...resto].join(' '); // Junta novamente com o resto do texto
    };

    // Aplica a capitalização apenas à primeira palavra
    return capitalizarPrimeiraPalavra(dataFormatada);
  }
};

export const formatarDataEscritaUTCNumber = (data: Date | string): string | undefined => {
  if (data) {
    // Formata a data usando toLocaleString
    const dataFormatada = new Date(data).toLocaleString('pt-BR', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Função auxiliar para capitalizar apenas a primeira palavra
    const capitalizarPrimeiraPalavra = (texto: string): string => {
      if (!texto) return texto;

      const [primeiraPalavra, ...resto] = texto.split(' '); // Divide o texto na primeira palavra e no resto
      const primeiraPalavraCapitalizada = primeiraPalavra.charAt(0).toUpperCase() + primeiraPalavra.slice(1);
      return [primeiraPalavraCapitalizada, ...resto].join(' '); // Junta novamente com o resto do texto
    };

    // Aplica a capitalização apenas à primeira palavra
    return capitalizarPrimeiraPalavra(dataFormatada);
  }
};

export const formatarDataInput = (dataParam: string): string | undefined => {
  if (dataParam) {
    if (/^\d{4}-\d{2}-\d{2}T/.test(dataParam)) {
      const data = new Date(dataParam);
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      const horas = String(data.getHours()).padStart(2, '0');
      const minutos = String(data.getMinutes()).padStart(2, '0');

      return `${ano}-${mes}-${dia}T${horas}:${minutos}`;
    } else {
      const [ano, mes, dia] = dataParam.split("-");
      return `${ano}-${mes}-${dia}`;
    }
  }
};

export const mascaraCPF = (v: string): string => {
  if (!v) return '';
  return v.replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const mascaraCNPJ = (v: string): string => {
  if (!v) return '';
  return v.replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

export const mascaraTelefone = (v: string): string => {
  if (!v) return '';
  v = v.replace(/\D/g, '');
  return v.length <= 10
    ? v.replace(/^(\d{2})(\d{4})(\d)/, '($1) $2-$3')
    : v.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3');
};

export const mascaraCEP = (v: string): string => {
  if (!v) return '';
  return v.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2");
};

export const mascaraMoedaReal = (v: number | string): string => {
  if (v === undefined || v === null) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(v));
};

export const retirarMascara = (v: string): string => {
  return v ? v.replace(/[^0-9]+/g, '') : "";
};

export const retirarMascaraTransformarNumber = (v: string): number | string => {
  if (v === undefined || v === null) return "";
  return Number(v.replace(/\D/g, "")) / 100;
};

export const calcularDiferencaDias = (data_inicial: Date | string, data_final: Date | string): number => {
  const data1 = new Date(data_inicial);
  const data2 = new Date(data_final);
  const diffEmMs = data2.getTime() - data1.getTime();
  return Math.max(1, diffEmMs / (1000 * 60 * 60 * 24));
};

export const formatStatus = (status: string | undefined) => {
  if (!status) return "";

  return status
    .toLowerCase() // Converte para minúsculas
    .replace(/_/g, " ") // Substitui "_" por espaço (caso venha do backend assim)
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitaliza cada palavra
};

export function aplicarMascaraCpfCnpj(valor?: string): string {
  if (typeof valor !== "string") return "";

  const documento = valor.replace(/\D/g, "");

  // CPF: até 11 dígitos
  if (documento.length <= 11) {
    return documento
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})?$/, "$1.$2.$3-$4")
      .replace(/[-.]$/, ""); // remove traço ou ponto pendente ao apagar
  }

  // CNPJ: 12 a 14 dígitos
  return documento
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})?$/, "$1.$2.$3/$4-$5")
    .replace(/[-./]$/, ""); // remove traço/ponto/barra pendente ao apagar
}

export function aplicarMascaraCpfCnpjOuNome(valor?: string): string {
  if (typeof valor !== "string") return "";

  // Se contém letras, trata como nome (não aplica máscara)
  if (/[a-zA-Z]/.test(valor)) {
    return valor; // Ou você pode capitalizar, remover acentos etc., se quiser
  }

  // Só números: aplicar máscara CPF ou CNPJ
  const documento = valor.replace(/\D/g, "");

  // CPF: até 11 dígitos
  if (documento.length <= 11) {
    return documento
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})?$/, "$1.$2.$3-$4")
      .replace(/[-.]$/, ""); // remove traço ou ponto pendente ao apagar
  }

  // CNPJ: mais de 11 dígitos
  return documento
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})?$/, "$1.$2.$3/$4-$5")
    .replace(/[-./]$/, ""); // remove traço/ponto/barra pendente ao apagar
}

/**
 * Formata coordenadas para o formato: 12°44'14.34"S
 * @param value - string contendo apenas números e pontos
 * @param tipo - 'latitude' ou 'longitude'
 * @returns string formatada ou original se incompleta
 */
export function formatarCoordenadaGMS(value: string, tipo: 'latitude' | 'longitude'): string {
  // Limpa tudo que não for número ou ponto
  const clean = value.replace(/[^\d.]/g, '');

  const grausLength = 2; // ⛳️ Sempre dois dígitos para graus (latitude e longitude)

  if (clean.length < grausLength + 2) return value;

  const graus = clean.slice(0, grausLength);
  const minutos = clean.slice(grausLength, grausLength + 2);
  const resto = clean.slice(grausLength + 2);

  let segundos = '';
  if (resto.includes('.')) {
    const [seg, dec] = resto.split('.');
    segundos = `${seg}.${dec.slice(0, 2)}`;
  } else {
    segundos = resto;
  }

  const direcao = tipo === 'latitude' ? 'S' : 'O';

  return `${graus}°${minutos}'${segundos}"${direcao}`;
}

export function formatarDataNotificacao(date: string | Date): string {
  const data = typeof date === "string" ? new Date(date) : date;
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffSegundos = Math.floor(diffMs / 1000);
  const diffMinutos = Math.floor(diffSegundos / 60);
  const diffHoras = Math.floor(diffMinutos / 60);
  const diffDias = Math.floor(diffHoras / 24);
  const diffSemanas = Math.floor(diffDias / 7);
  const diffMeses = Math.floor(diffDias / 28);
  const diffAnos = Math.floor(diffDias / 365);

  if (diffSegundos < 60) return `${diffSegundos} segundo${diffSegundos === 1 ? '' : 's'}`;
  if (diffMinutos < 60) return `${diffMinutos} minuto${diffMinutos === 1 ? '' : 's'}`;
  if (diffHoras < 24) return `${diffHoras} hora${diffHoras === 1 ? '' : 's'}`;
  if (diffDias < 7) return `${diffDias} dia${diffDias === 1 ? '' : 's'}`;
  if (diffSemanas < 4) return `${diffSemanas} semana${diffSemanas === 1 ? '' : 's'}`;
  if (diffMeses < 12) return `${diffMeses} mês${diffMeses === 1 ? '' : 'es'}`;

  return `${diffAnos} ano${diffAnos === 1 ? '' : 's'}`;
}

export function hojeComHoraZerada() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

// RETIRAR Z DA DATE
export function ensureLocalDateFromUTC(utcDateString: string | Date) {
  if (!utcDateString) return null;

  const dateStr = typeof utcDateString === "string" ? utcDateString : utcDateString.toISOString();
  const dateWithoutZ = dateStr.endsWith("Z") ? dateStr.slice(0, -1) : dateStr;

  const date = new Date(dateWithoutZ);

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export function contadorPeriodicidade(num: number) {

  let retorno = "Sem periodicidade.";

  switch (num) {
    case 1:
      retorno = "Mensal"
      break;
    case 2:
      retorno = "Bimestral"
      break;
    case 3:
      retorno = "Trimestral"
      break;
    case 6:
      retorno = "Semestral"
      break;
    case 12:
      retorno = "Anual"
      break;
  }

  return retorno;
};

export function eventCalendarAction(value: string): string {
  const val = (value || "").trim().toLowerCase();

  switch (val) {
    case "expiracao":
      return "Vencimento";
    case "relatorio":
      return "Relatório";
    case "coleta":
      return "Coleta";
    case "renovacao":
      return "Renovação";
    case "vistoria":
      return "Vistoria";
    default:
      return value; // se não bater, retorna como veio
  }
}

export function normalizeText(text: string) {
  return text
    .normalize("NFD")               // separa letras de acentos
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/ç/g, "c")              // trata cedilha
    .replace(/[^a-z0-9 ]/gi, "");    // opcional: remove outros caracteres especiais
}

import { z } from 'zod';

// Regex para validar número de telefone brasileiro
// Aceita: +5511999998888, 5511999998888, 11999998888, 1199998888
const brazilianPhoneRegex = /^(\+?55)?(\d{2})(\d{4,5})(\d{4})$/;

export const phoneSchema = z.string()
  .min(1, { message: "Telefone é obrigatório" })
  .refine((val) => {
    // Remove espaços, parênteses, traços
    const cleaned = val.replace(/[\s()-]/g, '');
    return brazilianPhoneRegex.test(cleaned);
  }, {
    message: "Telefone inválido. Use o formato: (11) 99999-9999 ou 11999999999"
  });

export const validateBrazilianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s()-]/g, '');
  return brazilianPhoneRegex.test(cleaned);
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '');
  
  // Formata conforme o tamanho
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  } else if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  }
};

export const normalizePhoneToE164 = (phone: string): string => {
  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '');
  
  // Adiciona +55 se não tiver código de país
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `+55${cleaned}`;
  } else if (cleaned.length === 12 || cleaned.length === 13) {
    return `+${cleaned}`;
  }
  
  return phone;
};
