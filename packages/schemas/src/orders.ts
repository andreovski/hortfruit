import { z } from 'zod';

import {
  type OrderStatusCode,
  orderStatusSchema,
  phoneInputSchema,
  type UnitCode,
} from './common';
import type { Week } from './week';

export const orderItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const orderNoteSchema = z.string().trim().max(500).nullable().optional();

/** Passo do telefone no fechamento. */
export const identifyBodySchema = z.object({ phone: phoneInputSchema });
export type IdentifyBody = z.infer<typeof identifyBodySchema>;

export type IdentifyResponse =
  | {
      found: true;
      customer: {
        name: string; // nome do restaurante
        maskedAddress: string; // só a rua, sem número: "Rua Itupava"
        neighborhood: string | null;
      };
    }
  /** Não encontrado ou inativo: o app mostra "fale com a Morro Verde" (sem distinguir os dois). */
  | { found: false };

export const createOrderBodySchema = z.object({
  phone: phoneInputSchema,
  items: z.array(orderItemInputSchema).min(1, 'O pedido está vazio.'),
  note: orderNoteSchema,
});
export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;

export const updateOrderBodySchema = z.object({
  items: z.array(orderItemInputSchema).min(1, 'O pedido está vazio.'),
  note: orderNoteSchema,
});
export type UpdateOrderBody = z.infer<typeof updateOrderBodySchema>;

export interface OrderItem {
  productId: string;
  name: string;
  unit: UnitCode;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  imageUrl: string;
  color: string;
}

/** Pedido pelo link secreto (/pedido/:token): o que o restaurante vê. */
export interface PublicOrder {
  token: string;
  number: number;
  status: OrderStatusCode;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
  canceledAt: string | null;
  canceledBy: 'CUSTOMER' | 'ADMIN' | null;
  note: string | null;
  /** Taxa de pedido abaixo do mínimo (0 quando atingiu). */
  feeCents: number;
  /** Itens + taxa. */
  totalCents: number;
  items: OrderItem[];
  customer: { name: string; maskedAddress: string; neighborhood: string | null };
  week: Week;
  /** Pode editar/cancelar agora (semana aberta e pedido não entregue nem cancelado). */
  canChange: boolean;
}

/** Resposta de criar/editar pedido. */
export interface OrderCreatedResponse {
  token: string;
  number: number;
}

/** "Meus pedidos" do aparelho: o app guarda os tokens e pede o resumo de todos de uma vez. */
export const lookupOrdersBodySchema = z.object({
  tokens: z.array(z.string().min(10).max(64)).max(100),
});
export type LookupOrdersBody = z.infer<typeof lookupOrdersBodySchema>;

export interface OrderSummary {
  token: string;
  number: number;
  status: OrderStatusCode;
  createdAt: string;
  deliveryDate: string;
  totalCents: number;
  itemCount: number;
  customerName: string;
  canChange: boolean;
  /** Primeiros itens, para as miniaturas. */
  items: Pick<OrderItem, 'productId' | 'name' | 'quantity' | 'unit' | 'imageUrl' | 'color'>[];
}

export interface LookupOrdersResponse {
  orders: OrderSummary[]; // mais recentes primeiro; tokens desconhecidos são ignorados
}

/* ---------------------------------- ADM ---------------------------------- */

export const adminOrdersQuerySchema = z.object({
  status: orderStatusSchema.optional(),
  search: z.string().trim().max(100).optional(),
  /** Sem weekId: a semana atual (mais recente). `all` = todas. */
  weekId: z.union([z.string().uuid(), z.literal('all')]).optional(),
});
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;

export interface AdminOrderRow {
  id: string;
  number: number;
  status: OrderStatusCode;
  createdAt: string;
  updatedAt: string;
  /** Editado pelo cliente depois de enviado. */
  editedAt: string | null;
  customer: { id: string; name: string; neighborhood: string | null };
  itemCount: number;
  totalCents: number;
}

export interface AdminOrdersResponse {
  week: Week | null;
  indicators: {
    awaitingConfirmation: number; // NOVO na semana
    weekOrders: number; // não cancelados na semana
    weekTotalCents: number; // soma dos não cancelados
    activeCustomersWithoutOrder: number;
  };
  orders: AdminOrderRow[];
}

export interface AdminOrderDetail extends AdminOrderRow {
  note: string | null;
  /** Taxa de pedido abaixo do mínimo (0 quando atingiu); já somada em totalCents. */
  feeCents: number;
  confirmedAt: string | null;
  deliveredAt: string | null;
  canceledAt: string | null;
  canceledBy: 'CUSTOMER' | 'ADMIN' | null;
  customer: AdminOrderRow['customer'] & {
    contactName: string | null;
    phone: string; // só dígitos
    address: string;
    city: string | null;
    notes: string | null;
  };
  items: OrderItem[];
  week: Week;
}

export const setOrderStatusBodySchema = z.object({ status: orderStatusSchema });
export type SetOrderStatusBody = z.infer<typeof setOrderStatusBodySchema>;

/** Contador do menu lateral (pedidos NOVO da semana atual). */
export interface NewOrdersCountResponse {
  count: number;
}

/** Lista de compra: soma da semana por produto (pedidos não cancelados). */
export interface PurchaseListResponse {
  week: Week | null;
  rows: {
    productId: string;
    name: string;
    unit: UnitCode;
    saleDescription: string;
    quantity: number;
    orderCount: number;
    totalCents: number;
  }[];
  totalCents: number;
}
