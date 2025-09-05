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

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const RoomDetails = React.lazy(() => import('./pages/RoomDetails'));
const MyBookings = React.lazy(() => import('./pages/MyBookings'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const RoomsPage = React.lazy(() => import('./pages/RoomsPage'));
const PaymentPage = React.lazy(() => import('./pages/PaymentPage'));
const BookingDetailsPage = React.lazy(() => import('./pages/BookingDetailPage'));
const LeaveReview = React.lazy(() => import('./pages/LeaveReview'));
const ContactUsPage = React.lazy(() => import('./pages/ContactUs'));
const AboutUs = React.lazy(() => import('./pages/AboutUs'));
const Policies = React.lazy(() => import('./pages/Policies'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Admin pages - loaded separately
const Layout = React.lazy(() => import('./pages/admin/Layout'));
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const ListRoom = React.lazy(() => import('./pages/admin/rooms/ListRoom'));
const ListRoomUnits = React.lazy(() => import('./pages/admin/room-units/ListRoomUnits'));
const ListBooking = React.lazy(() => import('./pages/admin/bookings/ListBooking'));
const BookingsCalendarPage = React.lazy(() => import('./pages/admin/bookings/BookingsCalendarPage'));
const BookingDetails = React.lazy(() => import('./pages/admin/bookings/BookingDetails'));
const ListAmenity = React.lazy(() => import('./pages/admin/amenities/ListAmenity'));
const ListPromos = React.lazy(() => import('./pages/admin/promos/ListPromos'));
const ListMeals = React.lazy(() => import('./pages/admin/meals/ListMeals'));
const ListUsers = React.lazy(() => import('./pages/admin/users/ListUsers'));
const ManageImages = React.lazy(() => import('./pages/admin/images/ManageImages'));

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
                path='/about-us'
                element={<AboutUs />}
              />
              <Route
                path='/contact-us'
                element={<ContactUsPage />}
              />
              <Route
                path='/policy'
                element={<Policies />}
              />
              <Route
                path='/rooms/:roomId'
                element={<RoomDetails />}
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
                path='/booking/:refNo/review'
                element={<LeaveReview />}
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
                <Route index element={<Dashboard />} />
                <Route path="rooms" element={<ListRoom />} />
                <Route path="room-units/:roomId" element={<ListRoomUnits />} />
                <Route path="bookings" element={<ListBooking />} />
                <Route path="bookings/calendar" element={<BookingsCalendarPage />} />
                <Route path="bookings/:id" element={<BookingDetails />} />
                <Route path="amenities" element={<ListAmenity />} />
                <Route path="users" element={<ListUsers />} />
                <Route path="reports" element={<ListRoom />} />
                <Route path="images" element={<ManageImages />} />
                <Route path="meal-prices" element={<ListMeals />} />
                <Route path="promos" element={<ListPromos />} />
                
                {/* Meal Programs */}
                <Route path="meal-programs" element={<MealProgramList />} />
                <Route path="meal-programs/new" element={<MealProgramNew />} />
                <Route path="meal-programs/:id/edit" element={<MealProgramEdit />} />
                <Route path="meal-programs/:id/preview" element={<MealProgramPreview />} />
                <Route path="meal-programs/:id" element={<MealProgramShow />} />
              </Route>
              {/* 404 Route - Must be last */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
          {!isAdminPath && <Footer />}
        </div>
      )
      }

      {!isAdminPath && <ResortPolicyDialog />}
      {/* <ResortPolicyDialog /> */}
      <Toaster position="top-right" richColors closeButton expand={true} />
    </>
  )
}

export default App
