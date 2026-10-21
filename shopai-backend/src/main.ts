import 'reflect-metadata';
import { Controller, Get, Module, ValidationPipe } from '@nestjs/common';
import { NestFactory, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import helmet from 'helmet';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { AiModule } from './ai/ai.module';
@Controller('api/health')
class HealthController { @Get() check() { return {status:'ok',timestamp:new Date().toISOString()}; } }
@Module({imports:[ConfigModule.forRoot({isGlobal:true}),ThrottlerModule.forRoot([{ttl:60000,limit:Number(process.env.RATE_LIMIT || 120)}]),PrismaModule,ProductModule,AuthModule,OrderModule,AiModule],controllers:[HealthController],providers:[{provide:APP_GUARD,useClass:ThrottlerGuard}]})
export class AppModule {}
export async function bootstrap() {
  const app=await NestFactory.create(AppModule,{logger:['error','warn','log']});
  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));
  app.enableShutdownHooks();
  SwaggerModule.setup('api/docs',app,SwaggerModule.createDocument(app,new DocumentBuilder().setTitle('ShopAI API').setVersion('1.0').addBearerAuth().build()));
  await app.listen(Number(process.env.PORT || 3000),'0.0.0.0');
  return app;
}
if(require.main===module) bootstrap().catch(()=>{console.error('Backend could not start. Check local environment configuration.');process.exitCode=1;});
