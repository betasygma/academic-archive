import { INestApplication, ValidationPipe } from '@nestjs/common';

export function initApp(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
}