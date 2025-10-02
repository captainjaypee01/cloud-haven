# Cloud Haven Frontend

A modern React-based frontend application for the Cloud Haven Resort Booking System, built with Vite, Tailwind CSS, and React Query.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd cloud-haven

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production
```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 🏗️ Technology Stack

- **Framework**: React 19.1.0
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS 4.1.10
- **State Management**: React Query (TanStack Query) 5.80.7
- **Forms**: React Hook Form 7.57.0 with Zod validation
- **Routing**: React Router DOM 7.6.2
- **Authentication**: Clerk 5.31.4
- **UI Components**: Radix UI primitives
- **Charts**: Recharts 2.15.4
- **Animations**: Framer Motion 12.17.3

## 📱 Features

### 🏨 **Booking System**
- **Overnight Bookings**: Traditional room reservations with date selection
- **Day Tour Bookings**: Single-day experiences with meal options
- **Shopping Cart**: Multi-item booking management
- **Checkout Process**: Guest information and payment handling
- **Booking Confirmation**: Reference number and email notifications

### 👤 **User Features**
- **Authentication**: Secure login with Clerk
- **My Bookings**: Personal booking management
- **Booking Details**: Complete booking information
- **Review System**: Guest feedback and ratings
- **Contact Form**: Customer support integration

### 🎨 **User Interface**
- **Responsive Design**: Mobile-first responsive layout
- **Dark/Light Mode**: Theme switching capability
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: Comprehensive error boundaries
- **Accessibility**: WCAG 2.1 compliant components

### 🏢 **Admin Dashboard**
- **Role-based Access**: Staff, Admin, and Superadmin roles
- **Booking Management**: Complete booking lifecycle
- **Calendar Views**: Visual booking and availability
- **Walk-in Bookings**: On-site booking creation
- **Payment Management**: Proof of payment review
- **User Management**: Staff and guest administration
- **Analytics**: Booking and revenue reporting

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── common/         # Shared components
│   └── ui/             # Base UI components
├── pages/              # Route-based page components
│   ├── admin/          # Admin dashboard pages
│   └── ...             # Public pages
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── services/           # API service layer
├── utils/              # Utility functions
├── constants/          # Application constants
└── assets/             # Static assets
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Feature Flags
VITE_COMING_SOON_FLAG=false
```

### Development Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Generate sitemap
npm run prebuild
```

## 🎨 UI Components

### Design System
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Custom Components**: Built on top of Radix UI
- **Responsive**: Mobile-first design approach

### Key Components
- **BookingForm**: Room and date selection
- **PaymentForm**: Payment proof upload
- **AdminCalendar**: Booking management calendar
- **RoleBasedRoute**: Protected route component
- **LoadingStates**: Skeleton and spinner components

## 🔐 Authentication & Authorization

### Clerk Integration
- **JWT Authentication**: Secure token-based auth
- **Role Management**: Staff, Admin, Superadmin roles
- **Protected Routes**: Role-based access control
- **User Context**: Global user state management

### Route Protection
```jsx
<RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
  <AdminComponent />
</RoleBasedRoute>
```

## 📊 State Management

### React Query
- **API Caching**: Automatic response caching
- **Background Updates**: Real-time data synchronization
- **Error Handling**: Global error management
- **Loading States**: Automatic loading indicators

### Context Providers
- **AppContext**: Global application state
- **AuthContext**: User authentication state
- **ThemeContext**: Dark/light mode management

## 🚀 Performance Optimizations

### Code Splitting
- **Lazy Loading**: Route-based code splitting
- **Component Splitting**: Dynamic imports for heavy components
- **Bundle Optimization**: Vite-based build optimization

### Caching Strategy
- **API Caching**: React Query response caching
- **Image Optimization**: Cloudinary-based optimization
- **Static Assets**: CDN delivery for assets

## 🧪 Testing

### Test Setup
```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Testing Strategy
- **Unit Tests**: Component testing with React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: Full user journey testing

## 📦 Build & Deployment

### Production Build
```bash
# Build optimized production bundle
npm run build

# Output will be in dist/ directory
```

### Docker Support
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

## 🔧 Development

### Code Style
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (if configured)
- **Conventional Commits**: Standardized commit messages

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

## 📚 API Integration

### Service Layer
```javascript
// API service example
import { apiClient } from './services/api';

export const bookingService = {
  createBooking: (data) => apiClient.post('/bookings', data),
  getBookings: () => apiClient.get('/my-bookings'),
  uploadPaymentProof: (bookingId, formData) => 
    apiClient.post(`/bookings/ref/${bookingId}/pay`, formData)
};
```

### Error Handling
- **Global Error Boundary**: Catches and displays errors
- **API Error Handling**: Centralized error management
- **User Feedback**: Toast notifications for actions

## 🚀 Deployment

### Environment Setup
1. **Development**: `npm run dev`
2. **UAT**: Build and deploy to UAT environment
3. **Production**: Build and deploy to production

### Build Optimization
- **Tree Shaking**: Remove unused code
- **Code Splitting**: Split code by routes
- **Asset Optimization**: Compress and optimize assets
- **CDN Integration**: Static asset delivery

## 📈 Monitoring

### Performance Monitoring
- **Bundle Analysis**: Vite bundle analyzer
- **Performance Metrics**: Core Web Vitals tracking
- **Error Tracking**: Error boundary reporting

### Analytics
- **User Behavior**: Booking flow analytics
- **Performance**: Page load times
- **Errors**: JavaScript error tracking

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Standards
- Follow existing code patterns
- Add proper TypeScript types
- Write comprehensive tests
- Update documentation

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For technical support or questions:
- **Email**: support@cloudhaven.com
- **Documentation**: [Internal Wiki]
- **Issues**: [GitHub Issues]

---

**Cloud Haven Frontend** - Built with ❤️ for modern resort booking