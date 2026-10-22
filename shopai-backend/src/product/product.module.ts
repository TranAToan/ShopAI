import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @ApiProperty() @IsInt() @Min(1) @Max(1000000000) price: number;
  @ApiProperty() @IsUrl() image: string;
}

@Injectable()
export class ProductService {
  private readonly products = [
    {
      id: 'backend_prod_0',
      name: 'Tai nghe Sony WH-1000XM5',
      price: 6990000,
      image:
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_1',
      name: 'iPhone 15 Pro Max',
      price: 29990000,
      image:
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_2',
      name: 'Sạc Anker Nano 30W',
      price: 1250000,
      image:
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_3',
      name: 'Tai nghe Sony WF-1000XM5',
      price: 5990000,
      image:
        'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_4',
      name: 'iPhone 15',
      price: 19990000,
      image:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_5',
      name: 'Sạc dự phòng Anker 20.000mAh',
      price: 1590000,
      image:
        'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_6',
      name: 'Loa Sony SRS-XB100',
      price: 1290000,
      image:
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_7',
      name: 'Apple Watch Series 9',
      price: 9990000,
      image:
        'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_8',
      name: 'Cáp Anker USB-C 240W',
      price: 390000,
      image:
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_9',
      name: 'Tai nghe Sony WH-CH720N',
      price: 2490000,
      image:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_10',
      name: 'iPad Air 11 inch',
      price: 16990000,
      image:
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_11',
      name: 'Sạc Anker 735 GaNPrime 65W',
      price: 1690000,
      image:
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_12',
      name: 'Sony PlayStation 5 Slim',
      price: 12990000,
      image:
        'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_13',
      name: 'MacBook Air 13 inch M3',
      price: 27990000,
      image:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_14',
      name: 'Chuột Logitech MX Master 3S',
      price: 2490000,
      image:
        'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_15',
      name: 'Bàn phím Logitech MX Keys Mini',
      price: 2290000,
      image:
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_16',
      name: 'Camera Sony ZV-E10',
      price: 16990000,
      image:
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_17',
      name: 'Loa Sony ULT FIELD 1',
      price: 2990000,
      image:
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_18',
      name: 'Sạc Anker MagGo Qi2',
      price: 1990000,
      image:
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'backend_prod_19',
      name: 'Tai nghe Sony LinkBuds S',
      price: 3990000,
      image:
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80',
    },
  ];

  all() {
    return this.products.map(product => ({ ...product }));
  }
  one(id: string) {
    const product = this.products.find(item => item.id === id);
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return { ...product };
  }
}

@ApiTags('Products')
@Controller('api/products')
export class ProductController {
  constructor(private readonly service: ProductService) {}
  @Get() all() {
    return this.service.all();
  }
  @Post() create(@Body() dto: CreateProductDto) {
    return {
      message: 'Dữ liệu hợp lệ (endpoint minh họa, không lưu catalog)',
      data: dto,
    };
  }
  @Get(':id') one(@Param('id') id: string) {
    return this.service.one(id);
  }
}

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
