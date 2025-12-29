import { ZodError, ZodSchema } from "zod";

interface QuerySchemaProps<T> {
  querys: Record<string, T>;
  hiddenQuerys?: Record<string, T>;
  schema?: ZodSchema<T>; // Schema para o valor T
}

interface URLSearchProps<T> {
  route: string;
  data: QuerySchemaProps<T>;
}

export function createURLSearch<T>({ route, data }: URLSearchProps<T>): string {
  const searchParams = new URLSearchParams();

  const querys = data.querys;
  const hiddenQuerys = data.hiddenQuerys;
  const schema = data.schema;

  // Função para adicionar querys
  const addQuery = (key: string, value: unknown) => {
    // Verifica se o valor é vazio, null, undefined ou "all", e se for, remove o parâmetro
    if (value === undefined || value === "" || value === null || value === "all") {
      if (searchParams.has(key)) {
        searchParams.delete(key);
      }
      return;
    }

    // Se houver um schema, valida o valor antes de adicionar à URL
    if (schema) {
      try {
        // CORREÇÃO DE LÓGICA: Valide o 'value' diretamente
        const valorParseado = schema.parse(value);
        
        // Adiciona o valor (que pode ter sido transformado pelo zod, ex: strToInt)
        searchParams.set(key, String(valorParseado));

      } catch (error) {
        if (error instanceof ZodError) {
          // CORREÇÃO DO ERRO: Use 'error.issues[0].message'
          console.error(`Query "${key}" não é válida de acordo com o schema: ${error.issues[0].message}`);
          return;
        }
      }
    } else {
      // Se não houver schema, apenas adicione
      searchParams.set(key, String(value));
    }
  };

  // (Aqui você precisará chamar 'addQuery' para os itens em 'querys' e 'hiddenQuerys')
  // Exemplo:
  if (querys) {
    Object.entries(querys).forEach(([key, value]) => {
      addQuery(key, value);
    });
  }
  if (hiddenQuerys) {
    Object.entries(hiddenQuerys).forEach(([key, value]) => {
      addQuery(key, value);
    });
  }

  // (O resto da sua função para retornar a URL...)
  const queryString = searchParams.toString();
  return queryString ? `${route}?${queryString}` : route;
}