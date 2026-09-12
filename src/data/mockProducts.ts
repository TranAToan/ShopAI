export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
};

const HEADPHONE_IMAGES = [
  'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1535969560547-76e4f2b3ecb3?auto=format&fit=crop&w=900&q=80',
];

export const MOCK_PRODUCTS: Product[] = Array.from(
  { length: 50 },
  (_, index) => ({
    id: `prod_${index}`,
    name: `Tai nghe Bluetooth Pro ${index + 1}`,
    price: 1500000 + index * 10000,
    image: HEADPHONE_IMAGES[index % HEADPHONE_IMAGES.length],
  }),
);
