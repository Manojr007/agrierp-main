# AgriERP - Agriculture Retail Management System

AgriERP is a comprehensive MERN stack application designed specifically for agriculture retail businesses (Seeds, Fertilizers, and Pesticides). It features inventory management, batch-wise sales, automated GST billing, credit tracking for farmers, and AI-powered insights.

## 🚀 Features

- **Inventory Control**: Batch-wise stock management with expiry alerts and low-stock notifications.
- **Sales Billing**: Professional GST-compliant invoice generation with support for multiple payment modes.
- **Farmer Management**: Track credit balances (Udhari) and transaction history for farmers.
- **AI Insights**: Seasonal demand prediction, expiry risk analysis, and credit risk scoring.
- **Reports**: P&L statements, Stock Valuation, and General Ledger reports.
- **Security**: JWT-based authentication with role-based access control (Admin/Staff).

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Recharts, React-Icons, React-Toastify.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Tools**: Docker, PDFKit (for Invoice Generation).

## 💻 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (Running locally or via Docker)

### Installation

1. **Clone and Install Backend**:
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the `server` directory (see `.env.example`):
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/agrierp
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   ```

3. **Clone and Install Frontend**:
   ```bash
   cd client
   npm install
   ```

### Running Locally

1. **Start Backend**:
   ```bash
   cd server
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd client
   npm run dev
   ```

### Running with Docker

```bash
docker-compose up --build
```

## 📡 Example API Requests

### Authentication
- `POST /api/auth/login`: `{ "email": "admin@agrierp.com", "password": "password123" }`
- `POST /api/auth/register`: `{ "name": "User", "email": "...", "password": "...", "role": "admin" }`

### Inventory & Products
- `GET /api/products`: List all products.
- `GET /api/products/alerts/low-stock`: Get low stock alerts.

### Sales & Billing
- `POST /api/sales`: Create a new sale entry.
- `GET /api/sales/invoice/:id`: Download PDF invoice.

### AI Insights
- `GET /api/ai/demand-prediction`: Get seasonal demand forecasting.
- `GET /api/ai/credit-risk`: Get AI-scored credit risks for farmers.

## 📄 License

Proprietary License - AgriERP
