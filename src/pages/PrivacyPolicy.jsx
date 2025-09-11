import React, { useMemo } from "react";
import SEO from "@/components/SEO";

const PrivacyPolicy = () => {
	const seoData = useMemo(() => ({
		title: "Privacy Policy - How We Collect and Use Data",
		description:
			"Learn how Netania De Laiya collects, uses, stores, and protects your personal data, including bookings, inquiries, and marketing preferences.",
		canonical:
			typeof window !== "undefined"
				? window.location.origin + "/privacy-policy"
				: "https://www.netaniadelaiya.com/privacy-policy",
		og: {
			url: "https://www.netaniadelaiya.com/privacy-policy",
			type: "website",
		},
		jsonLd: {
			"@context": "https://schema.org",
			"@type": "WebPage",
			name: "Privacy Policy",
			description:
				"Learn how Netania De Laiya collects, uses, stores, and protects your personal data.",
		},
	}), []);

	return (
		<div className="min-h-screen bg-white text-gray-800">
			<SEO {...seoData} />
			<div className="relative w-full bg-gradient-to-b from-blue-50 to-white">
				<div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-0 py-16 mt-16">
					<h1 className="text-3xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
					<p className="text-gray-600 text-base md:text-lg">
						Your privacy is important to us. We adhere to the Philippines Data Privacy Act (RA 10173) and applicable best practices to protect your personal data.
					</p>

					<div className="mt-10 space-y-8">
						<section>
							<h2 className="text-xl md:text-2xl font-semibold mb-2">Personal Data We Collect</h2>
							<p className="text-gray-700">
								We may collect your name, contact details (email, phone, address), booking details, preferences, government-issued IDs where required by law, transaction and payment information (processed by secure third-party providers), device and browser data, and communication records with our support team.
							</p>
						</section>

						<section>
							<h2 className="text-xl md:text-2xl font-semibold mb-2">How We Use Your Data</h2>
							<ul className="list-disc pl-6 space-y-2 text-gray-700">
								<li>Process reservations, day tour bookings, payments, and refunds.</li>
								<li>Communicate booking confirmations, reminders, updates, and support responses.</li>
								<li>Improve services, website functionality, and user experience.</li>
								<li>Send service-related notices and (with consent) marketing updates and promotions.</li>
								<li>Comply with legal obligations and regulatory requirements.</li>
							</ul>
						</section>

						<section>
							<h2 className="text-xl md:text-2xl font-semibold mb-2">Sharing and Disclosure</h2>
							<p className="text-gray-700">
								We do not sell your personal data. We may share data with trusted service providers (e.g., payment processors, email/SMS gateways, cloud hosting, analytics) under data processing agreements, and only as necessary to provide our services or comply with the law.
							</p>
						</section>

						<section>
							<h2 className="text-xl md:text-2xl font-semibold mb-2">Security</h2>
							<p className="text-gray-700">
								We apply reasonable organizational, physical, and technical measures to protect personal data, including access controls, encrypted transport, and data minimization. While no method is 100% secure, we continuously improve our safeguards.
							</p>
						</section>

						<section>
							<h2 className="text-xl md:text-2xl font-semibold mb-2">Cookies</h2>
							<p className="text-gray-700">
								We use cookies to operate the site, remember preferences, and understand how the site is used. You can manage cookies in your browser settings. Disabling some cookies may affect site functionality.
							</p>
						</section>

						<section>
							<h2 className="text-xl md:text-2xl font-semibold mb-2">Your Data Privacy Rights</h2>
							<ul className="list-disc pl-6 space-y-2 text-gray-700">
								<li>Access and obtain a copy of your personal data.</li>
								<li>Request rectification or deletion of inaccurate or unnecessary data.</li>
								<li>Object to processing or request restriction, subject to legal bases.</li>
								<li>Withdraw consent for marketing at any time.</li>
							</ul>
							<p className="text-gray-700 mt-2">
								To exercise your rights, please contact us using the details below. We will respond as required by applicable law.
							</p>
						</section>

						<section>
							<h2 className="text-xl md:text-2xl font-semibold mb-2">Data Retention</h2>
							<p className="text-gray-700">
								We retain personal data only as long as necessary for the purposes set out above and to comply with legal, accounting, or reporting obligations.
							</p>
						</section>

						<section>
							<h2 className="text-xl md:text-2xl font-semibold mb-2">Contact</h2>
							<p className="text-gray-700">
								For privacy inquiries, requests, or complaints, please reach us via our contact channels on the Contact Us page. If unresolved, you may contact the National Privacy Commission (NPC) in the Philippines.
							</p>
						</section>

						<p className="text-gray-500 text-sm mt-10">
							Last updated: {new Date().toLocaleDateString()}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PrivacyPolicy;


