export interface Distributor {
    dist_id: number;
    dist_name: string;
    dist_code: string;
}

export interface OrderDetail {
    id: number;
    po_number: string;
    po_date: string;
    dlv_date: string;
    principle: string;
    sku: string;
    order_qty: number;
    uom: string;
    status: 'DRAFT' | 'SUBMITTED' | 'CANCELLED';
    created_date: string;
    order_type?: string;
    periode?: string;
}

export interface Product {
    sku: string;
    description: string;
    uom: string;
    price: number;
}
