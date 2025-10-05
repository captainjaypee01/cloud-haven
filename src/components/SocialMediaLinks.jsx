import React from 'react'
import { assets } from '@/assets/assets'

const SocialMediaLinks = () => {
    const socialLinks = [
        {
            name: 'Facebook',
            url: 'https://www.facebook.com/profile.php?id=100064182843841',
            icon: assets.facebookIcon,
            color: 'bg-blue-600'
        },
        {
            name: 'Instagram',
            url: 'https://www.instagram.com/netaniadelaiya/',
            icon: assets.instagramIcon,
            color: 'bg-pink-600'
        }
    ]

    return (
        <section className="py-12 bg-gray-50">
            <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-16">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Follow Us on Social Media
                    </h2>
                    <p className="text-lg text-gray-600">
                        Stay connected with Netania De Laiya for the latest updates, special offers, and beautiful moments from our resort.
                    </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-4">
                    {socialLinks.map((social, index) => (
                        <a
                            key={index}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${social.color} text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity duration-200 flex items-center gap-2 font-medium`}
                        >
                            <img src={social.icon} alt={`${social.name} icon`} className="w-5 h-5 brightness-0 invert" />
                            {social.name}
                        </a>
                    ))}
                </div>
                
                <div className="mt-8 text-center">
                    <p className="text-gray-600 mb-4">
                        Share your Netania De Laiya experience with us!
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                        <span className="text-xs sm:text-sm text-gray-500">#NetaniaDeLaiya</span>
                        <span className="text-xs sm:text-sm text-gray-500">#LaiyaBatangas</span>
                        <span className="text-xs sm:text-sm text-gray-500">#BeachfrontResort</span>
                        <span className="text-xs sm:text-sm text-gray-500">#PhilippinesResort</span>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default SocialMediaLinks
