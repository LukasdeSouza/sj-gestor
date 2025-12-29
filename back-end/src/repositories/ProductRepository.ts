import { CreateProductData, Product, ProductsResponse } from "../interfaces/Product";
import { paginate, PaginationOptions } from "../utils/pagination";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default class ProductRepository {
  static async listProducts(where: any, options: PaginationOptions): Promise<ProductsResponse> {

    return await paginate(prisma.product, where, options)
  }

  static async createProduct(validatedData: CreateProductData): Promise<Product> {

    const { user_id, ...rest } = validatedData;

    return await prisma.product.create({
      data: {
        ...rest,
        user: { connect: { id: user_id } }
      }
    })
  }

  static async alterProduct(id: string, validatedData: Partial<CreateProductData>): Promise<Product> {

    const { user_id, ...rest } = validatedData;

    return await prisma.product.update({
      where: { id },
      data: {
        ...rest,
        // Não necessita alterar de quem é esse valor rs
        // user: { connect: { id: user_id } }, 
      }
    })
  }

  static async deleteProduct(id: string): Promise<Product> {

    return await prisma.product.delete({
      where: { id }
    })
  }

  static async findProduct(id: string): Promise<Product | null> {

    return await prisma.product.findUnique({
      where: { id }
    })
  }
}
