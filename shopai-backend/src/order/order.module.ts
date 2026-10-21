import { BadRequestException, Body, ConflictException, Controller, Get, Headers, Inject, Injectable, Module, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { createHash, randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { AuthRequest, JwtAuthGuard } from '../auth/auth.module';
import { ProductModule, ProductService } from '../product/product.module';
import { PrismaOrderRepository, type OrderRepository } from './order.repository';
export class OrderItemDto {
  @ApiProperty({example:'backend_prod_0'}) @IsString() @IsNotEmpty() @MaxLength(100) productId:string;
  @ApiProperty({example:1}) @IsInt() @Min(1) @Max(100) quantity:number;
}
export class CreateOrderDto {
  @ApiProperty({type:[OrderItemDto]}) @IsArray() @ArrayNotEmpty() @ArrayMaxSize(100) @ValidateNested({each:true}) @Type(()=>OrderItemDto) items:OrderItemDto[];
  @ApiProperty({example:1000000}) @IsInt() @Min(1) @Max(2000000000) total:number;
}
@Injectable()
export class OrderService {
  constructor(private readonly products:ProductService,@Inject('IOrderRepository') private readonly repo:OrderRepository) {}
  async create(dto:CreateOrderDto,userId:string,key?:string) {
    const requestKey=key || randomUUID();
    if(!/^[a-zA-Z0-9_-]{8,100}$/.test(requestKey)) throw new BadRequestException('Idempotency-Key không hợp lệ');
    const requestHash=createHash('sha256').update(JSON.stringify(dto)).digest('hex');
    const previous=await this.repo.findRequest(userId,requestKey);
    if(previous) {
      if(previous.requestHash!==requestHash) throw new ConflictException('Mã yêu cầu đã dùng cho đơn khác');
      return previous;
    }
    const items=dto.items.map(item=>{
      let product;
      try { product=this.products.one(item.productId); } catch { throw new BadRequestException('Sản phẩm không còn tồn tại'); }
      return {...item,name:product.name,price:product.price};
    });
    const total=items.reduce((sum,item)=>sum+item.price*item.quantity,0);
    if(!Number.isSafeInteger(total) || total>2000000000 || total!==dto.total) throw new BadRequestException('Tổng tiền không khớp. Vui lòng tải lại giỏ hàng.');
    try {
      return await this.repo.save({id:`ORD-${randomUUID()}`,user:{connect:{id:userId}},total,requestKey,requestHash,items:{create:items}});
    } catch(error) {
      if(error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2002') {
        const saved=await this.repo.findRequest(userId,requestKey);
        if(saved?.requestHash===requestHash) return saved;
      }
      throw error;
    }
  }
  mine(userId:string) { return this.repo.mine(userId); }
  async one(userId:string,id:string) { const order=await this.repo.one(userId,id); if(!order) throw new NotFoundException('Không tìm thấy hóa đơn'); return order; }
  async pay(userId:string,id:string) {
    const order=await this.one(userId,id);
    if(!['PENDING','PAID'].includes(order.status)) throw new BadRequestException('Không thể thanh toán đơn ở trạng thái này');
    await this.repo.pay(userId,id);
    return this.one(userId,id);
  }
}
@ApiTags('Orders') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('api/orders')
export class OrderController {
  constructor(private readonly service:OrderService) {}
  @Post() create(@Req() req:AuthRequest,@Body() dto:CreateOrderDto,@Headers('idempotency-key') key?:string) { return this.service.create(dto,req.user.id,key); }
  @Get() mine(@Req() req:AuthRequest) { return this.service.mine(req.user.id); }
  @Get(':id') one(@Req() req:AuthRequest,@Param('id') id:string) { return this.service.one(req.user.id,id); }
  @Post(':id/pay') pay(@Req() req:AuthRequest,@Param('id') id:string) { return this.service.pay(req.user.id,id); }
}
@Module({imports:[ProductModule],controllers:[OrderController],providers:[OrderService,{provide:'IOrderRepository',useClass:PrismaOrderRepository}]})
export class OrderModule {}
