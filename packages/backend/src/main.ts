import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Learniverse API')
    .setDescription('The Learniverse Backend API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app as any, config);
  SwaggerModule.setup('api/docs', app as any, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend server listening at http://localhost:${port}`);

  // Handle perfect desktop encapsulation by gracefully shutting down and logging
  const isDesktop = process.env.IS_ELECTRON === 'true' || process.env.DESKTOP_ENV === 'true';
  if (isDesktop) {
    console.log(`[Desktop Encapsulation Mode Active]`);
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      await app.close();
      console.log('HTTP server closed');
      process.exit(0);
    });
  }
}

bootstrap();
