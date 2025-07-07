import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Homepage from './pages/Home';
import Home from './pages/Home';
import Footer from './components/Footer';
import Rooms from './pages/Rooms';
import RoomDetails from './pages/RoomDetails';
import MyBookings from './pages/MyBookings';
import Layout from './pages/admin/Layout';
import Dashboard from './pages/admin/Dashboard';
import AddRoom from './pages/admin/rooms/AddRoom';
import ListRoom from './pages/admin/rooms/ListRoom';
import ComingSoon from './components/ComingSoon';
import { Toaster } from "@/components/ui/sonner";
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import RoomsPage from './pages/RoomsPage';
import ResortPolicyDialog from './components/common/ResortPolicyDialog';
import PaymentPage from './pages/PaymentPage';

const App = () => {

  const isAdminPath = useLocation().pathname.includes("admin");
  const isComingSoon = import.meta.env.VITE_COMING_SOON_FLAG === 'true'
  // console.log('isComingSoon', isComingSoon, import.meta.env.VITE_COMING_SOON_FLAG)
  return (
    <>
      {isComingSoon ? (
        <ComingSoon />
      ) : (
        <div>
          {!isAdminPath && <Navbar />}
          <div className='min-h-[70vh]'>
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
                path='/rooms-page'
                element={<RoomsPage />}
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
                <Route path="rooms/add" element={<AddRoom />} />
              </Route>
            </Routes>
          </div>
          {!isAdminPath && <Footer />}
        </div>
      )
      }

      <ResortPolicyDialog
      />
      <Toaster position="top-right" richColors closeButton expand={true} />
    </>
  )
}

export default App