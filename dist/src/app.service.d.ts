export declare class AppService {
    getHello(): string;
    getHealth(): {
        status: string;
        service: string;
        timestamp: string;
        uptime: number;
    };
}
