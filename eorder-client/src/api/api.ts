import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3002/api',
});

export const distributorApi = {
    getAll: async () => {
        const response = await api.get('/distributors');
        return response.data.data;
    },
};

export interface OrderFilters {
    dist_id?: number;
    principle?: string;
    periode?: string;
    po_number?: string;
    status?: 'DRAFT' | 'SUBMITTED' | 'CANCELLED';
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
    update: async (id: number, data: any) => {
        const response = await api.patch(`/order-details/${id}`, data);
        return response.data.data;
    },
    submit: async (id: number, data?: any) => {
        const response = await api.patch(`/order-details/${id}/submit`, data);
        return response.data.data;
    },
};
