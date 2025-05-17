import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Homepage from './pages/Home';
import Home from './pages/Home';
import Footer from './components/Footer';
import Rooms from './pages/Rooms';

const App = () => {

  const isOwnerPath = useLocation().pathname.includes("owner");
  return (
    <div>
      {!isOwnerPath && <Navbar />}
      <div className='min-h-[70vh]'>
        <Routes>
          <Route
            path='/'
            element={<Home />}
          />
          <Route
            path='/rooms'
            element={<Rooms />}
          />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

export default App