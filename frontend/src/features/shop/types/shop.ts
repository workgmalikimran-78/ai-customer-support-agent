export interface Product {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  stockQuantity: number;
  imageUrl: string | null;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
}

export interface CustomerOrder {
  id: string;
  status: string;
  totalCents: number;
  items: OrderItem[];
  createdAt: string;
}

export interface PlaceOrderInput {
  productId: string;
  quantity: number;
}

export interface CustomerAuthResponse {
  token: string;
  customerId: string;
  email: string;
  displayName: string;
}

export interface CustomerRegisterInput {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
}

export interface CustomerLoginInput {
  email: string;
  password: string;
}
