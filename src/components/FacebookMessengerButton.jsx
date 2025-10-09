import React from 'react';
import { Button } from '@/components/ui/button';

const FacebookMessengerButton = () => {
    const handleMessengerClick = () => {
        // Open Messenger in a new tab
        window.open('https://m.me/110863420514369', '_blank', 'noopener,noreferrer');
    };

    return (
        <Button
            onClick={handleMessengerClick}
            size="icon"
            className="fixed bottom-6 right-6 z-50 bg-[#0084FF] hover:bg-[#0066CC] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-110 group h-14 w-14"
            aria-label="Chat with us on Facebook Messenger"
            title="Chat with us on Facebook Messenger"
        >
            {/* Facebook Messenger Icon */}
            <svg
                className="w-24 h-24"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z" />
            </svg>

            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-[#0084FF] animate-ping opacity-20"></div>

            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                Chat with us on Messenger
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
            </div>
        </Button>
    );
};

export default FacebookMessengerButton;
