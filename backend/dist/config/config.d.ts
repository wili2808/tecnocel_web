export declare const config: {
    database: {
        name: string;
        user: string;
        password: string;
        host: string;
        port: number;
        dialect: string;
    };
    server: {
        port: number;
        env: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    logging: {
        level: string;
        maxFileSize: number;
        maxFiles: number;
    };
};
