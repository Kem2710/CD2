import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CallsModule } from './calls/calls.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
  useFactory: (c: ConfigService) => ({
  type: 'postgres' as const,
  host: c.get<string>('DB_HOST'),
  port: Number(c.get<string>('DB_PORT')),
  username: c.get<string>('DB_USER'),
  password: c.get<string>('DB_PASS'),
  database: c.get<string>('DB_NAME'),
  autoLoadEntities: true,
  synchronize: true, // tự tạo bảng, chỉ dùng cho đồ án/dev
}),
    }),
    CallsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}