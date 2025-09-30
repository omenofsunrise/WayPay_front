export interface SoldProduct {
  id: number;
  creditId: number;
  name: string;
  price: number;
  surcharge?: number;
  surchargeAmount?: number;
}