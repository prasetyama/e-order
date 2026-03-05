export interface Distributor {
    DistID: number;
    DistName: string;
    DistShort: string;
}

export interface OrderDetail {
    id: number;
    dist_id: number;
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
    filename: string;
}

export interface Product {
    Material_Code: string;
    Material_Description: string;
    CRT2PLT: number;
    BASEUOM: string;
    price: number;
}
