import { Request, Response } from 'express';
declare class AlmacenController {
    private transformProductsWithImages;
    private transformProductsWithImagesSafe;
    private transformProductWithImage;
    getProducts(req: Request, res: Response): Promise<void>;
    getProductById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createProduct(req: Request, res: Response): Promise<void>;
    updateProduct(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteProduct(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    searchProducts(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getProductsByCategory(req: Request, res: Response): Promise<void>;
    updateStock(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getFeaturedProducts(req: Request, res: Response): Promise<void>;
    getAllCategories(req: Request, res: Response): Promise<void>;
    diagnosticProducts(req: Request, res: Response): Promise<void>;
}
declare const _default: AlmacenController;
export default _default;
