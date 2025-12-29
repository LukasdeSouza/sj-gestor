import { Prisma } from '@prisma/client';

export interface PaginationOptions {
    page: number;
    limit: number;
    customLabels?: Record<string, string>;
}

export const paginate = async <T>(
    model: any, // Modelo Prisma (ex.: prisma.usuario)
    where: Prisma.Args<typeof model, 'findMany'>['where'],
    options: PaginationOptions,
    extraArgs: Prisma.Args<typeof model, 'findMany'> = {} 
): Promise<any> => {
    const { page = 1, limit = 10, customLabels } = options;

    const skip = (page - 1) * limit;

    // Contar o total de documentos
    const totalDocs = await model.count({ where });

    // Buscar os documentos paginados
    const docs = await model.findMany({
        where,
        skip,
        take: limit,
        ...extraArgs
    });

    // Calcular metadados de paginação
    const totalPages = Math.ceil(totalDocs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const nextPage = hasNextPage ? page + 1 : null;
    const prevPage = hasPrevPage ? page - 1 : null;

    // Estrutura de resposta padronizada
    const defaultLabels = {
        totalDocs: 'resultados',
        docs: 'data',
        limit: 'limite',
        page: 'pagina',
        totalPages: 'totalPaginas',
        pagingCounter: false,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: false,
        nextPage: false,
    };

    const labels = { ...defaultLabels, ...customLabels };

    const response: Record<string, any> = {
        [labels.totalDocs]: totalDocs,
        [labels.docs]: docs,
        [labels.limit]: limit,
        [labels.page]: page,
        [labels.totalPages]: totalPages,
    };

    // Adicionar campos condicionais apenas se os rótulos estiverem definidos
    if (typeof labels.hasNextPage === 'string') {
        response[labels.hasNextPage] = hasNextPage;
    }
    if (typeof labels.hasPrevPage === 'string') {
        response[labels.hasPrevPage] = hasPrevPage;
    }
    if (typeof labels.nextPage === 'string') {
        response[labels.nextPage] = nextPage;
    }
    if (typeof labels.prevPage === 'string') {
        response[labels.prevPage] = prevPage;
    }

    return response;
};