import React, { useMemo } from "react";
import SEO from "@/components/SEO";
import { STATIC_IMG, staticImgAbsolute } from '@/constants/staticImages';

const Terms = () => {
	const seoData = useMemo(() => ({
		title: "Terms & Conditions | Netania De Laiya",
		description:
			"Read the official Terms & Conditions including payment terms, booking & rescheduling, occupancy, security, pool/beach hours, and proper conduct. Located in the heart of Laiya, San Juan, Batangas with excellent service and warm hospitality.",
		canonical:
			typeof window !== "undefined"
				? window.location.origin + "/terms"
				: "https://www.netaniadelaiya.com/terms",
		og: { 
			title: "Terms & Conditions | Netania De Laiya",
			description: "Read the official Terms & Conditions including payment terms, booking & rescheduling, occupancy, security, pool/beach hours, and proper conduct. Located in the heart of Laiya, San Juan, Batangas with excellent service and warm hospitality.",
			image: staticImgAbsolute(STATIC_IMG.bgCover),
			url: "https://www.netaniadelaiya.com/terms", 
			type: "website",
			locale: 'en_PH',
			siteName: 'Netania De Laiya'
		},
		jsonLd: {
			"@context": "https://schema.org",
			"@type": "WebPage",
			name: "Terms and Conditions",
			description:
				"Official Terms and Conditions of Netania De Laiya Resort.",
		},
	}), []);

	return (
		<div className="min-h-screen bg-white text-gray-800">
			<SEO {...seoData} />
			<div className="relative w-full bg-gradient-to-b from-blue-50 to-white">
				<div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-0 py-16 mt-16">
					<h1 className="text-3xl md:text-5xl font-bold mb-6">Terms and Conditions</h1>

					<div className="space-y-10">
						<section>
							<h2 className="text-2xl font-semibold mb-3">Modes and Details of Payment</h2>
							<h3 className="text-lg font-medium mb-2">Terms of Payment</h3>
							<ul className="list-disc pl-6 space-y-2 text-gray-700">
								<li>50% deposit upon confirmation of booking through BDO.</li>
								<li>
									<strong>Remaining 50% balance — if cash or online banking:</strong> Settle at the resort before check-in time.
								</li>
								<li>
									<strong>Remaining 50% balance — if company cheque:</strong> Deposit to Netania De Laiya account one week before the event.
								</li>
								<li>Any additional charges should be settled before check-out time.</li>
								<li>Credit card is not allowed.</li>
								<li>Personal check is not allowed.</li>
							</ul>

							<div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
								<h4 className="font-semibold text-blue-700">Bank Details</h4>
								<p><strong>BANK:</strong> BDO</p>
								<p><strong>Account Name:</strong> NETANIA DE LAIYA INC.</p>
								<p><strong>Account Number:</strong> 004978007114</p>
							</div>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-3">House Rules & Policies</h2>

							<h3 className="text-lg font-medium mt-4 mb-2">1. Check-in/Out, Booking, Rescheduling</h3>
							<ul className="list-disc pl-6 space-y-2 text-gray-700">
								<li>
									<strong>1.1</strong> Check-in time: 3:00 PM / Check-out time: 1:00 PM. Extended hours may be allowed depending on room availability; rate adjustment applies; requires at least 16 hours advance notice.
								</li>
								<li>
									<strong>1.2</strong> You may enter the resort gate 15 minutes before check-in to settle the balance. Please wait in the parking area or at available seating while waiting for check-in at 3:00 PM.
								</li>
								<li>
									<strong>1.3</strong> Rescheduling: Inform the resort 1 week before the schedule. Deposits are non-refundable but we allow rescheduling (valid for 30 days).
								</li>
								<li>
									<strong>1.4</strong> Final number of rooms and headcount due 1 week before the schedule. If reducing without prior notice, the difference is not refundable. Drivers are included in the final headcount. Children 3 and below are free of charge.
								</li>
								<li><strong>1.5</strong> Forfeited reservation if the client fails to arrive on the date of reservation.</li>
								<li>
									<strong>1.6</strong> Pets allowed: Maximum of two (2) pets per cabana or table for day tours, regardless of number of rooms for overnight. Only pets ≤ 18 kg. Pets must be leashed or in a kennel/carrier; diapers encouraged in public areas.
								</li>
								<li>
									<strong>1.7</strong> Ecological Fee: Present Booking Confirmation at the Municipal Tourism Reception Area. Pay ₱50 per person and claim your Ecological Fee tickets and Referral Slip; present the Referral Slip upon arrival.
								</li>
							</ul>

							<h3 className="text-lg font-medium mt-6 mb-2">2. Occupancy & Room Services</h3>
							<ul className="list-disc pl-6 space-y-2 text-gray-700">
								<li><strong>2.1</strong> Room capacity shall be strictly observed.</li>
								<li>
									<strong>2.2</strong> Bringing food is not allowed inside the rooms. You can order through the resort restaurant menu an hour in advance. You may bring snacks, chips, bread, pizza, fruits, fast food, liquor and drinks — no corkage.
								</li>
								<li><strong>2.3</strong> Bringing lechon (with corkage fee ₱2,500).</li>
							</ul>

							<h3 className="text-lg font-medium mt-6 mb-2">3. Damages and Losses of Resort's Property</h3>
							<ul className="list-disc pl-6 space-y-2 text-gray-700">
								<li><strong>3.1</strong> Guests are responsible for any damage that may occur during their stay.</li>
							</ul>

							<h3 className="text-lg font-medium mt-6 mb-2">4. Security Concerns, Damages & Missing Items/Valuables</h3>
							<ul className="list-disc pl-6 space-y-2 text-gray-700">
								<li><strong>4.1</strong> The resort is not liable for lost, stolen, or damaged items. Do not leave belongings unattended.</li>
								<li><strong>4.2</strong> Gate closes at 10:00 PM; for emergencies, inform front desk or guard for assistance.</li>
							</ul>

							<h3 className="text-lg font-medium mt-6 mb-2">5. Swimming Pool and Beach Availability</h3>
							<ul className="list-disc pl-6 space-y-2 text-gray-700">
								<li>Beach cut-off time: 6:00 PM</li>
								<li>Swimming pool cut-off time: 10:00 PM</li>
							</ul>

							<h3 className="text-lg font-medium mt-6 mb-2">6. Proper Conduct</h3>
							<ul className="list-disc pl-6 space-y-2 text-gray-700">
								<li>
									<strong>6.1</strong> Observe silence between 10:00 PM to 6:30 AM. Refrain from loud music or noise during these hours. Karaokes or sound systems are allowed only for exclusive and pre-arranged functions.
								</li>
							</ul>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-3">Additional Terms</h2>

							<h3 className="text-lg font-medium mt-4 mb-2">Registration</h3>
							<p className="text-gray-700">Only registered guests may be accommodated. A valid government-issued ID is required at check-in.</p>

							<h3 className="text-lg font-medium mt-6 mb-2">Minors</h3>
							<p className="text-gray-700">Guests under 18 must be accompanied by a parent or legal guardian. Children 3 years old and below are free of charge per our policy.</p>

							<h3 className="text-lg font-medium mt-6 mb-2">Early Check-in</h3>
							<p className="text-gray-700">Subject to availability and prior arrangement. Additional charges may apply consistent with our extended-hours policy.</p>

							<h3 className="text-lg font-medium mt-6 mb-2">Room Keys</h3>
							<p className="text-gray-700">Please return room keys to the Front Desk upon check-out or when leaving the premises. Lost or damaged keys may incur a replacement fee.</p>

							<h3 className="text-lg font-medium mt-6 mb-2">Personal Belongings</h3>
							<p className="text-gray-700">The resort is not liable for loss or damage to personal items unless due to proven negligence. Use the in-room safe where available and keep doors locked when unattended.</p>

							<h3 className="text-lg font-medium mt-6 mb-2">Damage & Repair</h3>
							<p className="text-gray-700">Do not move room furniture or tamper with electrical or other installations. Report any malfunction to the Front Desk for assistance.</p>

							<h3 className="text-lg font-medium mt-6 mb-2">Water & Energy Conservation</h3>
							<p className="text-gray-700">Turn off faucets, lights, and appliances when not in use. Keep windows and doors closed while the air-conditioning is running.</p>

							<h3 className="text-lg font-medium mt-6 mb-2">Laundry</h3>
							<p className="text-gray-700">Washing clothes inside rooms is not allowed. Laundry service may be requested through the Front Desk.</p>

							<h3 className="text-lg font-medium mt-6 mb-2">Smoking</h3>
							<p className="text-gray-700">Smoking is not permitted inside guest rooms. Please use designated smoking areas, if any.</p>

							<h3 className="text-lg font-medium mt-6 mb-2">Medical Assistance</h3>
							<p className="text-gray-700">In case of illness or injury, our staff can help coordinate medical assistance or transport at the guest’s expense.</p>

							<h3 className="text-lg font-medium mt-6 mb-2">Waiver</h3>
							<p className="text-gray-700">Except in cases of proven negligence by the resort or its staff, the resort is not responsible for death, injury, illness, or loss/damage to property. Guests may be required to sign a waiver.</p>

							<h3 className="text-lg font-medium mt-6 mb-2">Management Rights</h3>
							<p className="text-gray-700">Management may refuse entry or accommodation, or request guests to vacate without refund if policies are breached or safety is at risk. Luggage may be removed and the room secured if necessary.</p>

							<h3 className="text-lg font-medium mt-6 mb-2">Feedback</h3>
							<p className="text-gray-700">Comments and suggestions are welcome. Please contact the Front Desk or use our official channels.</p>
						</section>

						<p className="text-gray-500 text-sm">
							This page summarizes the official Terms and Conditions of Netania De Laiya Resort.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Terms;


