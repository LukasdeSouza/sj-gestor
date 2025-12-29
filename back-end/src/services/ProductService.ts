import ProductRepository from "../repositories/ProductRepository";
import { CreateProductData, ListProductParams, Product } from "../interfaces/Product";
import { APIError } from "../utils/wrapException";
import { ProductSchemas } from "../schemas/ProductSchema";

export default class ProductService {
  static async listProducts(params: ListProductParams) {

    const { page, limit, user_id, name } = params;

    const where: Record<string, any> = {};

    if (user_id) where.user_id = user_id;
    
    if (name && name.trim().length) {
      where.name = { contains: name.trim(), mode: "insensitive" };
    }

    const productData = await ProductRepository.listProducts(where, {
      page: page,
      limit: limit,
      customLabels: {
        totalDocs: "resultados",
        docs: "products",
        limit: "limite",
        page: "pagina",
        totalPages: "totalPaginas",
      },
    });

    return productData;
  }

  static async createProduct(data: CreateProductData): Promise<Product> {

    const validatedData = ProductSchemas.create.safeParse(data);

    if (!validatedData.success) {
      throw new APIError(validatedData.error, 422);
    }

    const productData = await ProductRepository.createProduct(validatedData.data);

    return productData;
  }

  static async alterProduct(id: string, data: Partial<CreateProductData>): Promise<Product> {

    const validatedData = ProductSchemas.alter.safeParse(data);

    if (!validatedData.success) {
      throw new APIError(validatedData.error, 422);
    }

    const productData = await ProductRepository.alterProduct(id, validatedData.data);

    return productData;
  }

  static async deleteProduct(id: string): Promise<Product> {

    const productData = await ProductRepository.deleteProduct(id);

    return productData;
  }

  static async findProduct(id: string): Promise<Product | null> {

    const productData = await ProductRepository.findProduct(id);

    if (!productData) throw new APIError("Produto não encontrado.", 404);

    return productData;
  }
}
