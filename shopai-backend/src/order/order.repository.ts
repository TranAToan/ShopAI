import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module';
type OrderRecord = Prisma.OrderGetPayload<{include:{items:true}}>;
export interface OrderRepository {
  save(data:Prisma.OrderCreateInput):Promise<OrderRecord>;
  findRequest(userId:string,requestKey:string):Promise<OrderRecord | null>;
  mine(userId:string):Promise<OrderRecord[]>;
  one(userId:string,id:string):Promise<OrderRecord | null>;
  pay(userId:string,id:string):Promise<void>;
}
@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma:PrismaService) {}
  save(data:Prisma.OrderCreateInput) { return this.prisma.order.create({data,include:{items:true}}); }
  findRequest(userId:string,requestKey:string) { return this.prisma.order.findUnique({where:{userId_requestKey:{userId,requestKey}},include:{items:true}}); }
  mine(userId:string) { return this.prisma.order.findMany({where:{userId},include:{items:true},orderBy:{createdAt:'desc'}}); }
  one(userId:string,id:string) { return this.prisma.order.findFirst({where:{id,userId},include:{items:true}}); }
  async pay(userId:string,id:string) { await this.prisma.order.updateMany({where:{id,userId,status:'PENDING'},data:{status:'PAID'}}); }
}
