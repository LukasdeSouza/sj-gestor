import { CreateProductData, ListProductParams } from "../interfaces/Product";
import ProductService from "../services/ProductService";
import { sendResponse } from "../utils/messages";
import { Request, Response } from "express";

export default class ProductController {
  static async listProducts(req: Request, res: Response): Promise<void> {

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const name = (req.query.name as string) || undefined;

    const params: ListProductParams = {
      page,
      limit,
      user_id: (req as any).decodedToken?.id as string,
      name,
    }

    const result = await ProductService.listProducts(params);

    sendResponse(res, 200, { data: result })
  }

  static async createProduct(req: Request, res: Response): Promise<void> {
    const userId = (req as any).decodedToken?.id as string;
    const product: CreateProductData = { ...req.body, user_id: userId };

    const result = await ProductService.createProduct(product);

    sendResponse(res, 200, { data: result })
  }

  static async alterProduct(req: Request, res: Response): Promise<void> {

    const product: Partial<CreateProductData> = { ...req.body };
    const { id } = req.params;

    const result = await ProductService.alterProduct(id, product);

    sendResponse(res, 200, { data: result })
  }

  static async deleteProduct(req: Request, res: Response): Promise<void> {

    const { id } = req.params;

    const result = await ProductService.deleteProduct(id);

    sendResponse(res, 200, { data: result })
  }

  static async findProduct(req: Request, res: Response): Promise<void> {

    const { id } = req.params;

    const result = await ProductService.findProduct(id);

    sendResponse(res, 200, { data: result })
  }
}
