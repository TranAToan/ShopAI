import axiosClient from '@api/axiosClient';
import { ProductListSchema, ProductSchema } from '../types/product.schema';
import { reportFailure } from './telemetry';
export async function fetchProductsPage(page: number) {
  try {
    const products = ProductListSchema.parse(
      (await axiosClient.get('/api/products')).data,
    );
    const start = page * 10;
    return {
      products: products.slice(start, start + 10),
      nextPage: start + 10 < products.length ? page + 1 : undefined,
    };
  } catch (error) {
    reportFailure('ProductFetchFailed');
    throw error;
  }
}
export async function fetchProduct(id: string, signal?: AbortSignal) {
  return ProductSchema.parse(
    (
      await axiosClient.get(`/api/products/${encodeURIComponent(id)}`, {
        signal,
      })
    ).data,
  );
}
