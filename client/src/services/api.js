import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://brilliant-education-production-a146.up.railway.app/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

// Inject token on every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('agrierp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 globally
API.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('agrierp_token');
            localStorage.removeItem('agrierp_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const loginAPI = (data) => API.post('/auth/login', data);
export const registerAPI = (data) => API.post('/auth/register', data);
export const getMeAPI = () => API.get('/auth/me');

// Company
export const getCompanyAPI = () => API.get('/company');
export const updateCompanyAPI = (data) => API.put('/company', data);

// Customers
export const getCustomersAPI = (params) => API.get('/customers', { params });
export const getCustomerAPI = (id) => API.get(`/customers/${id}`);
export const createCustomerAPI = (data) => API.post('/customers', data);
export const updateCustomerAPI = (id, data) => API.put(`/customers/${id}`, data);
export const deleteCustomerAPI = (id) => API.delete(`/customers/${id}`);
export const getCustomerHistoryAPI = (id) => API.get(`/customers/${id}/history`);

// Suppliers
export const getSuppliersAPI = (params) => API.get('/suppliers', { params });
export const getSupplierAPI = (id) => API.get(`/suppliers/${id}`);
export const createSupplierAPI = (data) => API.post('/suppliers', data);
export const updateSupplierAPI = (id, data) => API.put(`/suppliers/${id}`, data);
export const deleteSupplierAPI = (id) => API.delete(`/suppliers/${id}`);

// Products
export const getProductsAPI = (params) => API.get('/products', { params });
export const getProductAPI = (id) => API.get(`/products/${id}`);
export const createProductAPI = (data) => API.post('/products', data);
export const updateProductAPI = (id, data) => API.put(`/products/${id}`, data);
export const deleteProductAPI = (id) => API.delete(`/products/${id}`);
export const getLowStockAPI = () => API.get('/products/alerts/low-stock');
export const getExpiringAPI = () => API.get('/products/alerts/expiring');
export const getProductBatchesAPI = (id) => API.get(`/products/${id}/batches`);

// Purchases
export const getPurchasesAPI = (params) => API.get('/purchases', { params });
export const getPurchaseAPI = (id) => API.get(`/purchases/${id}`);
export const createPurchaseAPI = (data) => API.post('/purchases', data);

// Sales
export const getSalesAPI = (params) => API.get('/sales', { params });
export const getSaleAPI = (id) => API.get(`/sales/${id}`);
export const createSaleAPI = (data) => API.post('/sales', data);
export const getInvoicePDF = (id) => API.get(`/sales/${id}/invoice`, { responseType: 'blob' });

// Reports
export const getDashboardAPI = () => API.get('/reports/dashboard');
export const getProfitLossAPI = (params) => API.get('/reports/profit-loss', { params });
export const getStockValuationAPI = () => API.get('/reports/stock-valuation');
export const getSalesReportAPI = (params) => API.get('/reports/sales', { params });
export const getPurchaseReportAPI = (params) => API.get('/reports/purchases', { params });
export const getLedgerReportAPI = (params) => API.get('/reports/ledger', { params });

// AI
export const getDemandPredictionAPI = () => API.get('/ai/demand-prediction');
export const getExpiryPredictionAPI = () => API.get('/ai/expiry-prediction');
export const getCreditRiskAPI = () => API.get('/ai/credit-risk');

// Ledger
export const createLedgerAPI = (data) => API.post('/ledger', data);
export const deleteLedgerAPI = (id) => API.delete(`/ledger/${id}`);

export default API;
