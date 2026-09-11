export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export const MOCK_PRODUCTS: Product[] = Array.from(
  { length: 50 },
  (_, index) => ({
    id: `prod_${index}`,
    name: `Tai nghe Bluetooth Pro ${index + 1}`,
    price: 1500000 + index * 10000,
    image: `https://picsum.photos/id/${10 + index}/400/400`,
  }),
);
