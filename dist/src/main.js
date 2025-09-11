"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const fs = require("fs");
const path = require("path");
async function bootstrap() {
    const dataDir = '/data';
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const publicPath = path.join(__dirname, '..', 'public');
    if (fs.existsSync(publicPath)) {
        app.useStaticAssets(publicPath);
        app.setBaseViewsDir(publicPath);
    }
    const config = new swagger_1.DocumentBuilder()
        .setTitle('LuckyPick2 Backend API')
        .setDescription('Production-ready backend for LuckyPick2 game with HD Wallet')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = configService.get('PORT', 3000);
    await app.listen(port);
    console.log(`LuckyPick2 Backend is running on port ${port}`);
    console.log(`API Documentation: http://localhost:${port}/api-docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map