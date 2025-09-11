import { AppService } from './app.service';
import { Response } from 'express';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getHealth(): {
        status: string;
        service: string;
        timestamp: string;
        uptime: number;
    };
    serveApp(res: Response): void;
}
