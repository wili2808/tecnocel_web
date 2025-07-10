import { Request, Response, NextFunction } from 'express';
interface ImageMiddlewareOptions {
    imagesPath: string;
    defaultImage?: string;
    maxAge?: number;
}
declare class StaticImageMiddleware {
    private imagesPath;
    private defaultImage;
    private maxAge;
    constructor(options: ImageMiddlewareOptions);
    private isValidFilename;
    private getMimeType;
    private fileExists;
    serveImage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private sendImage;
    validateImagesDirectory(): boolean;
}
export default StaticImageMiddleware;
