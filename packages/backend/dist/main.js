"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Enable CORS
    app.enableCors();
    // Enable global validation
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    // Swagger setup
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Learniverse API')
        .setDescription('The Learniverse Backend API description')
        .setVersion('1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`Backend server listening at http://localhost:${port}`);
}
bootstrap();
