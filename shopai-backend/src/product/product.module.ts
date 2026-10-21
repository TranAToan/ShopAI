import { Body, Controller, Get, Injectable, Module, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';
export class CreateProductDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @ApiProperty() @IsInt() @Min(1) @Max(1000000000) price: number;
  @ApiProperty() @IsUrl() image: string;
}
@Injectable()
export class ProductService {
  private readonly products = Array.from({length:20}, (_,i) => ({
    id:`backend_prod_${i}`, name:`${['Điện thoại','Laptop','Tai nghe','Phụ kiện'][i % 4]} ShopAI ${i + 1}`,
    price:1000000 + i * 10000, image:`https://picsum.photos/id/${200+i}/400/400`,
  }));
  all() { return this.products.map(p=>({...p})); }
  one(id:string) { const p=this.products.find(x=>x.id===id); if(!p) throw new NotFoundException('Không tìm thấy sản phẩm'); return {...p}; }
}
@ApiTags('Products') @Controller('api/products')
export class ProductController {
  constructor(private readonly service:ProductService) {}
  @Get() all() { return this.service.all(); }
  @Post() create(@Body() dto:CreateProductDto) { return {message:'Dữ liệu hợp lệ (endpoint minh họa, không lưu catalog)',data:dto}; }
  @Get(':id') one(@Param('id') id:string) { return this.service.one(id); }
}
@Module({controllers:[ProductController],providers:[ProductService],exports:[ProductService]})
export class ProductModule {}
