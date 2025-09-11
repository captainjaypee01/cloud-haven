export const RESORT_POLICIES = {
  checkin: {
    title: "Resort Policy",
    description: "Arrival/departure times, rescheduling rules, headcount, pets, and ecological fees.",
    policies: [
      {
        category: "Guidelines",
        rules: [
          "1.1 Check-in time: 3:00 PM / Check-out time: 1:00 PM. Extended hours depend on availability; rate adjustment applies; requires at least 16 hours advance notice.",
          "1.2 You may enter the resort gate 15 minutes before check-in to settle the balance. Wait in parking or seating areas until 3:00 PM.",
          "1.3 Rescheduling: Inform the resort 1 week before schedule. Deposits are non-refundable; rescheduling valid for 30 days.",
          "1.4 Final rooms and headcount due 1 week before schedule. Reductions without notice are not refundable. Drivers are included. Children 3 and below are free of charge.",
          "1.5 Forfeited reservation if the client fails to arrive on the reserved date.",
          "1.6 Pets allowed: Max two (2) pets per cabana or table for day tours; regardless of overnight rooms. Pets up to 18 kg only. Keep leashed or in carrier; diapers encouraged in public areas.",
          "1.7 Ecological Fee: Present Booking Confirmation at Municipal Tourism Reception Area. Pay ₱50/person and claim tickets with Referral Slip; present slip upon arrival."
        ]
      }
    ]
  },

  occupancy: {
    title: "Occupancy & Room Services",
    description: "Room capacity and food policy inside rooms.",
    policies: [
      {
        category: "Guidelines",
        rules: [
          "2.1 Room capacity shall be strictly observed.",
          "2.2 Bringing food is not allowed inside rooms. Order via resort restaurant an hour in advance. Snacks, chips, bread, pizza, fruits, fast food, liquor and drinks are allowed — no corkage.",
          "2.3 Bringing lechon (corkage fee ₱2,500)."
        ]
      }
    ]
  },

  damages: {
    title: "Damages & Losses",
    description: "Guest responsibility for damages to resort property.",
    policies: [
      {
        category: "Guidelines",
        rules: [
          "3.1 Guests are responsible for any damage that may occur during their stay."
        ]
      }
    ]
  },

  security: {
    title: "Security & Valuables",
    description: "Liability, missing items, and gate hours.",
    policies: [
      {
        category: "Guidelines",
        rules: [
          "4.1 The resort is not liable for lost, stolen, or damaged items. Keep valuables secure and do not leave belongings unattended.",
          "4.2 Gate closes at 10:00 PM; for emergencies, inform front desk or guard for assistance."
        ]
      }
    ]
  },

  facilities: {
    title: "Pool & Beach Availability",
    description: "Operating hours for beach and pools.",
    policies: [
      {
        category: "Hours",
        rules: [
          "Beach cut-off time: 6:00 PM",
          "Swimming pool cut-off time: 10:00 PM"
        ]
      }
    ]
  },

  conduct: {
    title: "Proper Conduct",
    description: "Quiet hours and courtesy to other guests.",
    policies: [
      {
        category: "Guidelines",
        rules: [
          "6.1 Observe silence between 10:00 PM to 6:30 AM. Refrain from loud music or noise during these hours. Karaokes or sound systems allowed only for exclusive and pre-arranged functions."
        ]
      }
    ]
  }
};

export const POLICY_ICONS = {
  checkin: "📝",
  occupancy: "🏨",
  damages: "🛠️",
  security: "🔐",
  facilities: "🏖️",
  conduct: "🤝"
};

export const HERO_IMAGE = "https://res.cloudinary.com/dm3gsotk5/image/upload/v1756913943/policy-1_b6xkhg.jpg";

// Optimized Cloudinary images with transformations for better performance
export const OPTIMIZED_IMAGES = {
  hero: {
    mobile: "https://res.cloudinary.com/dm3gsotk5/image/upload/f_auto,q_auto,w_768,c_fill,g_auto/v1756913943/policy-1_b6xkhg.jpg",
    tablet: "https://res.cloudinary.com/dm3gsotk5/image/upload/f_auto,q_auto,w_1024,c_fill,g_auto/v1756913943/policy-1_b6xkhg.jpg",
    desktop: "https://res.cloudinary.com/dm3gsotk5/image/upload/f_auto,q_auto,w_1920,c_fill,g_auto/v1756913943/policy-1_b6xkhg.jpg",
    webp: "https://res.cloudinary.com/dm3gsotk5/image/upload/f_webp,q_auto,w_1920,c_fill,g_auto/v1756913943/policy-1_b6xkhg.jpg"
  }
};