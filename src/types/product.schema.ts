import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  price: z.number().positive(),
  image: z.string().url(),
});

export const ProductListSchema = z.array(ProductSchema);
export type Product = z.infer<typeof ProductSchema>;