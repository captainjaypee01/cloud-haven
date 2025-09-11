import React from 'react'
import { assets } from '@/assets/assets'
import { Link } from "react-router-dom";
import { NETANIA_LOGO } from '@/constants/AppConstant';
import { SUPPORT_ADDRESS, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_LANDLINE } from '@/constants/AppConstant';

const Footer = () => {
    return (
        <div className='bg-[#F6F9FC] text-gray-500/80 pt-8 px-6 md:px-16 lg:px-24 xl:px-32'>
            <div className='flex flex-wrap justify-between gap-12 md:gap-6'>
                <div className='max-w-80'>
                    <img src={NETANIA_LOGO} alt="logo" className='mb-4 h-8 md:h-9' />
                    <p className='text-sm'>
                        Discover the world's most extraordinary place to stay, from botique hotels to luxury villas and private islands.
                    </p>
                    <div className='flex items-center gap-3 mt-4'>
                        {/* Instagram */}
                        <a href="https://www.instagram.com/netaniadelaiya" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                            <img src={assets.instagramIcon} alt='instagram-icon' className='w-6' />
                        </a>
                        {/* Facebook */}
                        <a href="https://www.facebook.com/profile.php?id=100064182843841" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                            <img src={assets.facebookIcon} alt='facebook-icon' className='w-6' />
                        </a>
                    </div>
                </div>

                <div>
                    <p className='font-playfair text-lg text-gray-800'>Netania De Laiya</p>
                    <ul className='mt-3 flex flex-col gap-2 text-sm'>
                        <li>
                            <Link to={`/about-us`}>About</Link>
                        </li>
                        <li>
                            <Link to={`/rooms`}>Accommodations</Link>
                        </li>
                        <li>
                            <Link to={`/policy`}>Resort Policy</Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <p className='font-playfair text-lg text-gray-800'>SUPPORT</p>
                    <ul className='mt-3 flex flex-col gap-2 text-sm'>
                        <li>
                            <Link to={`/contact-us`}>Contact Us</Link>
                        </li>
                    </ul>
                </div>

                <div className='max-w-80'>
                    <p className='font-playfair text-lg text-gray-800'>GET IN TOUCH</p>
                    <p className='mt-3 text-sm'>
                        {SUPPORT_ADDRESS}
                    </p>
                    <p className='mt-3 text-sm'>
                        Telephone: {SUPPORT_LANDLINE}
                    </p>
                    <p className='mt-3 text-sm'>
                        Phone: {SUPPORT_PHONE}
                    </p>
                    <p className='mt-3 text-sm'>
                        Email: {SUPPORT_EMAIL}
                    </p>
                </div>
            </div>
            <hr className='border-gray-300 mt-8' />
            <div className='flex flex-col md:flex-row gap-2 items-center justify-between py-5'>
                <p>© {new Date().getFullYear()} Netania De Laiya. All rights reserved.</p>
                <ul className='flex items-center gap-4'>
                    <li><Link to={`/privacy`}>Privacy</Link></li>
                    <li><Link to={`/terms`}>Terms</Link></li>
                    <li><a href="#">Sitemap</a></li>
                </ul>
            </div>
        </div>
    )
}

export default Footer