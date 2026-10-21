import { Body, CanActivate, ConflictException, Controller, ExecutionContext, Global, HttpCode, Injectable, Module, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import type { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module';
export class LoginDto {
  @ApiProperty({example:'demo@shopai.com'}) @Transform(({value}: {value:unknown})=>typeof value==='string'?value.trim().toLowerCase():value) @IsEmail() @MaxLength(254) email:string;
  @ApiProperty({example:'123456'}) @IsString() @MinLength(6) @MaxLength(72) password:string;
}
export class RegisterDto extends LoginDto {
  @ApiProperty({required:false}) @IsOptional() @IsString() @MinLength(2) @MaxLength(100) name?:string;
}
export type AuthRequest = Request & { user:{id:string;email:string} };
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt:JwtService, private readonly prisma:PrismaService) {}
  async canActivate(context:ExecutionContext) {
    const req=context.switchToHttp().getRequest<AuthRequest>();
    const match=/^Bearer (\S+)$/i.exec(req.headers.authorization || '');
    if(!match) throw new UnauthorizedException('Cần đăng nhập');
    try {
      const payload=await this.jwt.verifyAsync<{sub:string;email:string}>(match[1],{algorithms:['HS256']});
      const user=await this.prisma.user.findUnique({where:{id:payload.sub},select:{id:true,email:true}});
      if(!user) throw new Error('Missing user');
      req.user=user; return true;
    } catch { throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn'); }
  }
}
@Injectable()
export class AuthService {
  constructor(private readonly prisma:PrismaService,private readonly jwt:JwtService) {}
  private result(user:{id:string;email:string;name:string|null}) {
    return {accessToken:this.jwt.sign({sub:user.id,email:user.email}),user:{id:user.id,email:user.email,name:user.name}};
  }
  async login(dto:LoginDto) {
    const user=await this.prisma.user.findUnique({where:{email:dto.email}});
    if(!user || !await bcrypt.compare(dto.password,user.password)) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    return this.result(user);
  }
  async register(dto:RegisterDto) {
    try {
      const user=await this.prisma.user.create({data:{email:dto.email,password:await bcrypt.hash(dto.password,12),name:dto.name?.trim() || null}});
      return this.result(user);
    } catch(error) {
      if(error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2002') throw new ConflictException('Email đã được đăng ký');
      throw error;
    }
  }
}
@ApiTags('Auth') @Controller('api/auth')
export class AuthController {
  constructor(private readonly auth:AuthService) {}
  @Post('login') @HttpCode(200) login(@Body() dto:LoginDto) { return this.auth.login(dto); }
  @Post('register') register(@Body() dto:RegisterDto) { return this.auth.register(dto); }
}
@Global()
@Module({imports:[JwtModule.registerAsync({inject:[ConfigService],useFactory:(config:ConfigService)=>{
  const secret=config.get<string>('JWT_SECRET');
  if(!secret || secret.length<32) throw new Error('JWT_SECRET must contain at least 32 characters');
  const ttl=config.get<string>('JWT_EXPIRES_IN') || '7d';
  const match=/^(\d+)([smhd])$/.exec(ttl);
  if(!match) throw new Error('Invalid JWT_EXPIRES_IN');
  const seconds=Number(match[1])*({s:1,m:60,h:3600,d:86400}[match[2]] || 1);
  return {secret,signOptions:{algorithm:'HS256' as const,expiresIn:seconds}};
}})],controllers:[AuthController],providers:[AuthService,JwtAuthGuard],exports:[JwtAuthGuard,JwtModule]})
export class AuthModule {}
