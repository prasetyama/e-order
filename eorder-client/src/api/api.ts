import axios from 'axios';

const api = axios.create({
    baseURL: 'http://172.17.253.122:3002/api',
    withCredentials: true,
});

export const distributorApi = {
    getAll: async () => {
        const response = await api.get('/distributors');
        return response.data.data;
    },
};

export const productsApi = {
    getAll: async () => {
        const response = await api.get('/products');
        return response.data.data;
    },
};

export interface OrderFilters {
    dist_id?: number;
    principle?: string;
    periode?: string;
    po_number?: string;
    filename?: string;
    status?: 'DRAFT' | 'SUBMITTED' | 'CANCELLED';
    grouped?: boolean;
}

export const orderApi = {
    getAll: async (params?: OrderFilters) => {
        const response = await api.get('/order-details', { params });
        return response.data.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`/order-details/${id}`);
        return response.data.data;
    },
    create: async (data: any) => {
        const response = await api.post('/order-details', data);
        return response.data.data;
    },
    initialize: async (data: any) => {
        const response = await api.post('/order-details/initialize', data);
        return response.data.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.patch(`/order-details/${id}`, data);
        return response.data.data;
    },
    submit: async (filename: string) => {
        const response = await api.post('/order-details/submit', { filename });
        return response.data.data;
    },
};

export const authApi = {
    validateToken: async (token: string) => {
        const response = await api.post('/auth/validate-token', { token });
        return response.data;
    },
};
