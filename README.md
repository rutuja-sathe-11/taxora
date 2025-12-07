# Taxora - AI-Powered Accounting & Compliance Platform

A comprehensive full-stack platform for SMEs, Freelancers, and Chartered Accountants with AI-powered invoice processing, compliance tracking, and tax advisory features.

## 🚀 Features

### For SME/Freelancers
- **AI Dashboard** - Real-time insights on income, expenses, and tax optimization
- **Smart Invoice Scanner** - OCR + NLP powered document processing
- **Transaction Management** - Complete financial transaction tracking
- **AI Tax Advisor** - Intelligent chatbot for tax queries
- **Document Vault** - Secure document storage with AI summaries
- **CA Connect** - Connect with Chartered Accountants

### For Chartered Accountants
- **Client Dashboard** - Manage multiple clients and compliance status
- **Review Queue** - AI-flagged transactions requiring attention
- **Tax Filing Assistant** - Automated GST and ITR preparation
- **Compliance Calendar** - Track deadlines and requirements
- **Reports Generator** - Comprehensive financial reports

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Radix UI** components
- **Lucide React** icons

### Backend
- **Django 4.2** with Django REST Framework
- **PostgreSQL** database
- **Celery** for background tasks
- **Redis** for caching and task queue
- **JWT** authentication

### AI/ML Services
- **Tesseract OCR** for text extraction
- **Hugging Face Transformers** for NER
- **Groq API** for conversational AI
- **OpenCV** for image preprocessing

## 📋 Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 13+

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd taxora
```

### 2. Backend Setup
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Setup PostgreSQL database
createdb taxora_db

# Copy environment file
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
python manage.py migrate

# Load initial data
python manage.py loaddata fixtures/initial_data.json

# Create superuser
python manage.py createsuperuser

# Start backend server
python manage.py runserver 8000
```

### 3. Frontend Setup
```bash
# Install Node dependencies
npm install

# Start development server
npm run dev
```
## 🔧 Configuration

### Environment Variables (.env)
```env
# Database
DB_NAME=taxora_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# AI Services
GROQ_API_KEY=your-groq-api-key
HUGGING_FACE_TOKEN=your-hf-token

# Redis
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

## 📚 API Documentation

### Authentication
```bash
# Register
POST /api/auth/register/
{
  "username": "user@example.com",
  "email": "user@example.com", 
  "password": "securepassword",
  "role": "SME",
  "business_name": "My Business"
}

# Login
POST /api/auth/login/
{
  "username": "user@example.com",
  "password": "securepassword"
}
```

### Documents
```bash
# Upload document
POST /api/documents/
Content-Type: multipart/form-data
{
  "file": <file>,
  "name": "Invoice 001",
  "category": "invoice"
}

# List documents
GET /api/documents/
```

### Transactions
```bash
# Create transaction
POST /api/transactions/
{
  "date": "2024-01-15",
  "description": "Office Supplies",
  "amount": "25000.00",
  "type": "expense",
  "category": "Office Expenses"
}

# Get summary
GET /api/transactions/summary/
```

### AI Services
```bash
# Chat with AI
POST /api/ai/chat/
{
  "message": "How can I save tax on professional income?",
  "context_documents": ["doc-id-1"],
  "context_transactions": ["txn-id-1"]
}

# Get insights
GET /api/ai/insights/
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **AES-256 Encryption** for sensitive data
- **Audit Logging** for all user actions
- **Role-based Access Control**
- **CORS Protection**
- **Input Validation & Sanitization**

## 🤖 AI Features

### OCR Processing
- Image preprocessing with OpenCV
- Tesseract OCR for text extraction
- Confidence scoring and validation

### NLP Analysis
- Named Entity Recognition (NER)
- Invoice data extraction
- Compliance checking
- Anomaly detection

### Conversational AI
- Context-aware responses
- Document and transaction integration
- Tax advisory capabilities
- Multi-turn conversations

## 📊 Database Schema

### Core Models
- **User** - Extended user model with business info
- **Transaction** - Financial transactions with tax details
- **Document** - File storage with AI processing results
- **ChatSession/ChatMessage** - AI conversation history
- **AIInsight** - Generated insights and recommendations
- **ComplianceCalendar** - Compliance tracking and reminders

## 🚦 Background Tasks

### Celery Tasks
- **Document Processing** - OCR and AI analysis
- **Transaction Analysis** - Compliance checking
- **Insight Generation** - Personalized recommendations
- **Compliance Reminders** - Automated notifications
- **Data Cleanup** - Periodic maintenance

## 🧪 Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
npm run test

# Integration tests
npm run test:e2e
```

## 📈 Performance

- **Database Indexing** for optimized queries
- **Redis Caching** for frequently accessed data
- **Lazy Loading** for large datasets
- **Image Optimization** for document processing
- **API Pagination** for efficient data transfer

## 🔧 Development

### Code Structure
```
backend/
├── taxora/           # Django project settings
├── apps/             # Django applications
│   ├── users/        # User management
│   ├── transactions/ # Financial transactions
│   ├── documents/    # Document management
│   ├── ai_services/  # AI/ML services
│   └── compliance/   # Compliance tracking
└── fixtures/         # Initial data

src/
├── components/       # React components
├── services/         # API services
├── types/           # TypeScript definitions
└── lib/             # Utility functions
```

### Development Commands
```bash
# Backend
cd backend
py -m venv venv
venv/scripts/activate
python manage.py makemigrations
python manage.py migrate
python manage.py runserver

# Frontend
npm install
npm run dev          # Development server

```

## 🚀 Deployment

### Production Setup
1. Configure environment variables
2. Set up PostgreSQL and Redis
3. Run migrations and collect static files
4. Configure reverse proxy (Nginx)
5. Set up SSL certificates
6. Configure monitoring and logging

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: prembagga04@gmail.com


---

**Taxora** - Simplifying accounting and compliance with AI 🚀