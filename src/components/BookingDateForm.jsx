import React from 'react'
import { assets } from '../assets/assets'

const BookingDateForm = () => {
    return (
        <form className='bg-white text-gray-700 rounded-lg px-6 py-4 mt-8 flex flex-col md:flex-row max-md:items-start gap-4 max-md:mx-auto'>

            <div>
                <div className='flex items-center gap-2'>
                    <img src={assets.calenderIcon} alt="calendar-checkin" className='h-4' />
                    <label htmlFor="checkIn">Check in</label>
                </div>
                <input id="checkIn" type="date" className="rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none max-wd:w-50" />
            </div>

            <div>
                <div className='flex items-center gap-2'>
                    <img src={assets.calenderIcon} alt="calendar-checkout" className='h-4' />
                    <label htmlFor="checkOut">Check out</label>
                </div>
                <input id="checkOut" type="date" className="rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none max-wd:w-50" />
            </div>

            <div>
                <div className='flex max-md:gap-2 max-md:items-center'>
                    <label htmlFor="guests">Adult Guests</label>
                </div>
                <input min={1} max={4} id="guests" type="number" className="rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none max-md:w-37 w-40" placeholder="0" />
            </div>
            <div>
                <div className='flex max-md:gap-2 max-md:items-center'>
                    <label htmlFor="childrenGuests">Children</label>
                </div>
                <input min={1} max={4} id="childrenGuests" type="number" className="rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none max-md:w-37 w-40" placeholder="0" />
            </div>
            <button className='flex items-center justify-center gap-1 rounded-md bg-black py-3 px-4 text-white my-auto cursor-pointer max-md:w-full max-md:py-1' >

                <img src={assets.searchIcon} alt="search" className='h-7' />
                <span>Search</span>
            </button>
        </form>
    )
}

export default BookingDateForm