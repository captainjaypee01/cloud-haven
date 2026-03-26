# Changelog

All notable changes to the Cloud Haven Frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Admin booking details: **Adjust nights** for overnight stays (change check-out; recalculates room, meal quote, extra guest fees, and promo discount). Available to staff, admin, and superadmin when status is pending, downpayment, or paid.
- Versioning system implementation
- Comprehensive README documentation

## [1.0.0] - 2025-01-27

### Added
- **Initial Release**: Complete Cloud Haven Resort Booking System Frontend
- **Authentication**: Clerk-based authentication system
- **Booking System**: 
  - Overnight room bookings with date selection
  - Day tour bookings with meal options
  - Shopping cart functionality
  - Checkout process with guest information
- **Admin Dashboard**:
  - Role-based access control (Staff, Admin, Superadmin)
  - Booking management with calendar views
  - Walk-in booking creation
  - Payment proof management
  - User management
- **Room Management**:
  - Room listing and details pages
  - Availability checking
  - Featured rooms display
- **Meal Programs**:
  - Dynamic meal pricing
  - Meal selection during booking
  - Admin meal program management
- **Payment System**:
  - Proof of payment upload
  - Payment status tracking
  - Booking confirmation emails
- **User Features**:
  - My bookings page
  - Booking details and status
  - Review system
  - Contact form
- **UI/UX**:
  - Responsive design for all devices
  - Dark/light theme support
  - Loading states and error handling
  - SEO optimization with dynamic sitemap
- **Technical Features**:
  - React 19 with Vite build system
  - Tailwind CSS for styling
  - React Query for state management
  - React Hook Form with Zod validation
  - Framer Motion animations
  - Recharts for data visualization

### Technical Stack
- React 19.1.0
- Vite 6.3.5
- Tailwind CSS 4.1.10
- React Query 5.80.7
- React Hook Form 7.57.0
- Clerk Authentication 5.31.4
- Radix UI Components
- Framer Motion 12.17.3
- Recharts 2.15.4

### Security
- Clerk JWT authentication
- Role-based route protection
- Input validation with Zod
- XSS protection
- CSRF token handling

### Performance
- Code splitting with lazy loading
- Image optimization with Cloudinary
- API response caching
- Bundle optimization with Vite
- SEO optimization

---

## Version History

- **1.0.0** - Initial release with complete booking system
- **Unreleased** - Versioning system and documentation improvements

## Release Notes

### v1.0.0 (2025-01-27)
- **Major Release**: First stable version of Cloud Haven Frontend
- **Features**: Complete booking system with admin dashboard
- **Architecture**: Modern React application with comprehensive feature set
- **Security**: Production-ready authentication and authorization
- **Performance**: Optimized for production deployment
