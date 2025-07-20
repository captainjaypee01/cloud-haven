import React from 'react'
import Navbar from '../../components/admin/Navbar'
import Sidebar from '../../components/admin/Sidebar'
import { Outlet } from 'react-router-dom'

const Layout = () => {
    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <div className="flex h-full">
                <Sidebar />
                <main className="flex-1 p-4 md:px-10 h-full overflow-auto bg-gray-50">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Layout