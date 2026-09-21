export type CartLine = {
  id: string;
  name: string;
  unitPrice: number;
  qty: number;
  image: string;
};

const CART_KEY = 'pe_cart';
const PICKUP_KEY = 'pe_pickups';

export type PickupRequest = {
  id: string;
  pickupOn: string;
  items: CartLine[];
  total: number;
  createdAt: string;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event('pe-cart-changed'));
}

export function readCart(): CartLine[] {
  return readJson<CartLine[]>(CART_KEY, []);
}

export function cartCount(lines = readCart()) {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

export function addToCart(item: Omit<CartLine, 'qty'>, qty = 1) {
  const lines = readCart();
  const found = lines.find((line) => line.id === item.id);
  if (found) found.qty += qty;
  else lines.push({ ...item, qty });
  writeJson(CART_KEY, lines);
}

export function setCartQty(id: string, qty: number) {
  const lines = readCart()
    .map((line) => (line.id === id ? { ...line, qty } : line))
    .filter((line) => line.qty > 0);
  writeJson(CART_KEY, lines);
}

export function clearCart() {
  writeJson(CART_KEY, []);
}

export function readPickups(): PickupRequest[] {
  return readJson<PickupRequest[]>(PICKUP_KEY, []);
}

export function savePickup(pickup: PickupRequest) {
  writeJson(PICKUP_KEY, [pickup, ...readPickups()]);
}
