export interface Distributor {
    DistID: number;
    DistName: string;
    DistShort: string;
}

export interface OrderDetail {
    id: number;
    ponumber: string;
    po_date: string;
    dlv_date: string;
    principal: string;
    sku: string;
    order_qty: number;
    uom: string;
    status: 'DRAFT' | 'SUBMITTED' | 'CANCELLED';
    createdate: Date;
    order_type?: string;
    periode?: string;
}

export interface Product {
    sku: string;
    description: string;
    uom: string;
    price: number;
}
