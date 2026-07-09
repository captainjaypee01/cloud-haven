import React, { Suspense, useEffect } from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer';
import ComingSoon from './components/ComingSoon';
import { Toaster } from "@/components/ui/sonner";
import ResortPolicyDialog from './components/common/ResortPolicyDialog';
import SEO from './components/SEO';
import Loader from './components/common/Loader';
import NoIndexEnvironments from './components/UATNoIndex';
import FacebookMessengerButton from './components/FacebookMessengerButton';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const RoomDetails = React.lazy(() => import('./pages/RoomDetails'));
const DayTourRoomDetails = React.lazy(() => import('./pages/DayTourRoomDetails'));
const MyBookings = React.lazy(() => import('./pages/MyBookings'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const RoomsPage = React.lazy(() => import('./pages/RoomsPage'));
const DayTour = React.lazy(() => import('./pages/DayTour'));
const PaymentPage = React.lazy(() => import('./pages/PaymentPage'));
const BookingDetailsPage = React.lazy(() => import('./pages/BookingDetailPage'));
const PublicReview = React.lazy(() => import('./pages/PublicReview'));
const ContactUsPage = React.lazy(() => import('./pages/ContactUs'));
// const AboutUs = React.lazy(() => import('./pages/AboutUs'));
const Policies = React.lazy(() => import('./pages/Policies'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const Terms = React.lazy(() => import('./pages/Terms'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Admin pages - loaded separately
const Layout = React.lazy(() => import('./pages/admin/Layout'));
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const ListRoom = React.lazy(() => import('./pages/admin/rooms/ListRoom'));
const RoomPricingCalendar = React.lazy(() => import('./pages/admin/rooms/RoomPricingCalendar'));
const ListRoomUnits = React.lazy(() => import('./pages/admin/room-units/ListRoomUnits'));
const RoomUnitCalendarPage = React.lazy(() => import('./pages/admin/room-units/RoomUnitCalendarPage'));
const BlockedDatesListPage = React.lazy(() => import('./pages/admin/room-units/BlockedDatesListPage'));
const AllBlockedDatesPage = React.lazy(() => import('./pages/admin/room-units/AllBlockedDatesPage'));
const ListBooking = React.lazy(() => import('./pages/admin/bookings/ListBooking'));
const BookingsCalendarPage = React.lazy(() => import('./pages/admin/bookings/BookingsCalendarPage'));
const BookingDetails = React.lazy(() => import('./pages/admin/bookings/BookingDetails'));
const WalkInBooking = React.lazy(() => import('./pages/admin/bookings/WalkInBooking'));
const ListAmenity = React.lazy(() => import('./pages/admin/amenities/ListAmenity'));
const ListPromos = React.lazy(() => import('./pages/admin/promos/ListPromos'));
const ListUsers = React.lazy(() => import('./pages/admin/users/ListUsers'));
const ManageImages = React.lazy(() => import('./pages/admin/images/ManageImages'));
const ListDayTourPricing = React.lazy(() => import('./pages/admin/day-tour-pricing/ListDayTourPricing'));
const RoomRevenueReport = React.lazy(() => import('./pages/admin/reports/RoomRevenueReport'));
const ListPayment = React.lazy(() => import('./pages/admin/payments/ListPayment'));
const ListReviews = React.lazy(() => import('./pages/admin/reviews/ListReviews'));

// Role-based route protection
const RoleBasedRoute = React.lazy(() => import('./components/admin/RoleBasedRoute'));

// Meal Programs
const MealProgramList = React.lazy(() => import('./pages/admin/meal-programs/index'));
const MealProgramNew = React.lazy(() => import('./pages/admin/meal-programs/new'));
const MealProgramEdit = React.lazy(() => import('./pages/admin/meal-programs/edit'));
const MealProgramShow = React.lazy(() => import('./pages/admin/meal-programs/show'));
const MealProgramPreview = React.lazy(() => import('./pages/admin/meal-programs/preview'));

const App = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.includes("admin");
  const isComingSoon = import.meta.env.VITE_COMING_SOON_FLAG === 'true'

  // Auto scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      {/* Default sitewide SEO fallbacks (no twitter) */}
      <SEO />
      <NoIndexEnvironments />
      {isComingSoon ? (
        <ComingSoon />
      ) : (
        <div>
          {!isAdminPath && <Navbar />}
          <div className='min-h-[70vh]'>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route
                  path='/'
                  element={<Home />}
                />
                <Route
                  path='/rooms'
                  element={<RoomsPage />}
                />
                <Route
                  path='/day-tour'
                  element={<DayTour />}
                />
                {/* <Route
                  path='/about-us'
                  element={<AboutUs />}
                /> */}
                <Route
                  path='/contact-us'
                  element={<ContactUsPage />}
                />
                <Route
                  path='/policy'
                  element={<Policies />}
                />
                <Route
                  path='/privacy'
                  element={<PrivacyPolicy />}
                />
                <Route
                  path='/terms'
                  element={<Terms />}
                />
                <Route
                  path='/rooms/:roomId'
                  element={<RoomDetails />}
                />
                <Route
                  path='/day-tour/:roomId'
                  element={<DayTourRoomDetails />}
                />
                <Route
                  path='/cart'
                  element={<Cart />}
                />
                <Route
                  path='/checkout'
                  element={<Checkout />}
                />
                <Route
                  path='/booking/:refNo'
                  element={<BookingDetailsPage />}
                />
                <Route
                  path='/review/:token'
                  element={<PublicReview />}
                />
                <Route
                  path='/booking/:refNo/payment'
                  element={<PaymentPage />}
                />
                <Route
                  path='/my-bookings'
                  element={<MyBookings />}
                />
                <Route
                  path='/admin'
                  element={<Layout />}
                >
                  {/* Staff, Admin, Superadmin routes */}
                  <Route index element={
                    <RoleBasedRoute allowedRoles={['staff', 'admin', 'superadmin']}>
                      <Dashboard />
                    </RoleBasedRoute>
                  } />
                  <Route path="bookings" element={
                    <RoleBasedRoute allowedRoles={['staff', 'admin', 'superadmin']}>
                      <ListBooking />
                    </RoleBasedRoute>
                  } />
                  <Route path="bookings/calendar" element={
                    <RoleBasedRoute allowedRoles={['staff', 'admin', 'superadmin']}>
                      <BookingsCalendarPage />
                    </RoleBasedRoute>
                  } />
                  <Route path="bookings/:id" element={
                    <RoleBasedRoute allowedRoles={['staff', 'admin', 'superadmin']}>
                      <BookingDetails />
                    </RoleBasedRoute>
                  } />
                  <Route path="bookings/walk-in" element={
                    <RoleBasedRoute allowedRoles={['staff', 'admin', 'superadmin']}>
                      <WalkInBooking />
                    </RoleBasedRoute>
                  } />
                  <Route path="room-units/calendar" element={
                    <RoleBasedRoute allowedRoles={['staff', 'admin', 'superadmin']}>
                      <RoomUnitCalendarPage />
                    </RoleBasedRoute>
                  } />

                  {/* Admin, Superadmin routes */}
                  <Route path="rooms" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <ListRoom />
                    </RoleBasedRoute>
                  } />
                  <Route path="rooms/:roomId/pricing" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <RoomPricingCalendar />
                    </RoleBasedRoute>
                  } />
                  <Route path="room-units/:roomId" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <ListRoomUnits />
                    </RoleBasedRoute>
                  } />
                  <Route path="room-units/:roomUnitId/blocked-dates" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <BlockedDatesListPage />
                    </RoleBasedRoute>
                  } />
                  <Route path="room-units/blocked-dates" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <AllBlockedDatesPage />
                    </RoleBasedRoute>
                  } />
                  <Route path="payments" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <ListPayment />
                    </RoleBasedRoute>
                  } />
                  <Route path="amenities" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <ListAmenity />
                    </RoleBasedRoute>
                  } />
                  <Route path="promos" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <ListPromos />
                    </RoleBasedRoute>
                  } />
                  <Route path="reviews" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <ListReviews />
                    </RoleBasedRoute>
                  } />

                  {/* Meal Programs - Admin, Superadmin */}
                  <Route path="meal-programs" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <MealProgramList />
                    </RoleBasedRoute>
                  } />
                  <Route path="meal-programs/new" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <MealProgramNew />
                    </RoleBasedRoute>
                  } />
                  <Route path="meal-programs/:id/edit" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <MealProgramEdit />
                    </RoleBasedRoute>
                  } />
                  <Route path="meal-programs/:id/preview" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <MealProgramPreview />
                    </RoleBasedRoute>
                  } />
                  <Route path="meal-programs/:id" element={
                    <RoleBasedRoute allowedRoles={['admin', 'superadmin']}>
                      <MealProgramShow />
                    </RoleBasedRoute>
                  } />

                  {/* Superadmin only routes */}
                  <Route path="users" element={
                    <RoleBasedRoute allowedRoles={['superadmin']}>
                      <ListUsers />
                    </RoleBasedRoute>
                  } />
                  <Route path="reports" element={
                    <RoleBasedRoute allowedRoles={['superadmin']}>
                      <RoomRevenueReport />
                    </RoleBasedRoute>
                  } />
                  <Route path="images" element={
                    <RoleBasedRoute allowedRoles={['superadmin']}>
                      <ManageImages />
                    </RoleBasedRoute>
                  } />
                  <Route path="day-tour-pricing" element={
                    <RoleBasedRoute allowedRoles={['superadmin']}>
                      <ListDayTourPricing />
                    </RoleBasedRoute>
                  } />
                </Route>
                {/* 404 Route - Must be last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
          {!isAdminPath && <Footer />}
          {!isAdminPath && <FacebookMessengerButton />}
        </div>
      )
      }

      {/* {!isAdminPath && <ResortPolicyDialog />} */}
      {/* <ResortPolicyDialog /> */}
      <Toaster position="top-right" richColors closeButton expand={true} />
    </>
  )
}

export default App
