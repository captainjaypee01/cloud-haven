export const RESORT_POLICIES = {
  checkin: {
    title: "Resort Policy",
    description: "Arrival/departure times, rescheduling rules, headcount, and ecological fees.",
    policies: [
      {
        category: "Guidelines",
        rules: [
          "1.1 Check-in time: 3:00 PM / Check-out time: 1:00 PM. Extended hours depend on availability; rate adjustment applies; requires at least 16 hours advance notice.",
          "1.2 You may enter the resort gate 15 minutes before check-in to settle the balance. Wait in parking or seating areas until 3:00 PM.",
          "1.3 Rescheduling: Inform the resort 1 week before schedule. Deposits are non-refundable; rescheduling valid for 30 days.",
          "1.4 Final rooms and headcount due 1 week before schedule. Reductions without notice are not refundable. Drivers are included. Children 3 and below are free of charge.",
          "1.5 Forfeited reservation if the client fails to arrive on the reserved date.",
          "1.6 Ecological Fee: Present Booking Confirmation at Municipal Tourism Reception Area. Pay ₱50/person and claim tickets with Referral Slip; present slip upon arrival."
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
  },

  childpolicy: {
    title: "Child Policy",
    description: "Age categories, pricing, and policies for children.",
    policies: [
      {
        category: "Age Categories & Pricing",
        rules: [
          "Children aged 3 years old and below are free of charge for the entrance fee.",
          "They are allowed to share a bed with accompanying adults at no additional cost.",
          "3 years old below are not required to avail of the buffet but may share food from the adults' plates.",
          "Children aged 4 to 6 years old will be charged a reduced buffet rate. Current pricing available during booking.",
          "7 years old above will be charged same rate as adult."
        ]
      },
      {
        category: "Additional Child Policies",
        rules: [
          "Final number of children and headcount must be confirmed one week before the booking schedule.",
          "The resort reserves the right to verify age with valid identification if needed.",
          "Children must be supervised by adults at all times, especially around water areas.",
          "Parents/guardians are responsible for their children's safety and conduct during the stay."
        ]
      }
    ]
  },

  pet: {
    title: "Pet Policy",
    description: "Guidelines for bringing pets to the resort.",
    policies: [
      {
        category: "Guidelines",
        rules: [
          "All pets are free of charge and must be strictly registered upon check-in. Guests are required to present a complete and up-to-date vaccination card at the time of registration.",
          "Pets are allowed only in designated pet-friendly rooms—Sea View and Garden View—located in the old hotel building.",
          "Pets are strictly not allowed in the new hotel building Pool view & Deluxe room.",
          "Pets are not permitted in the restaurant, pool areas, or other restricted facilities.",
          "Only domesticated pets, specifically dogs and cats, are allowed.",
          "A maximum of two (2) pets is allowed per room, with each pet not exceeding 18 kg.",
          "Pets must be kept on a leash or placed in a carrier at all times while in public areas.",
          "Pets should not be left unattended in the room at any time.",
          "Guests are responsible for ensuring that their pets do not disturb other guests. Excessive noise or aggressive behavior may result in the removal of the pet from the premises.",
          "For hygiene purposes, towels, linens, and other hotel amenities are strictly for guest use only and must not be used for pets.",
          "As a courtesy to other guests, pet owners are responsible for cleaning up after their pets at all times and in all areas of the property. Housekeeping must be notified should assistance be required.",
          "Management reserves the right to refuse or discontinue pet accommodation should any of the above policies not be followed.",
          "Pet owners are fully responsible for their pets at all times and shall be liable for any injury or damage caused by their pets to other guests, staff, or property. This includes medical expenses, property and equipment repairs, and personal damages."
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
  conduct: "🤝",
  childpolicy: "👶",
  pet: "🐕"
};

export const HERO_IMAGE = "https://res.cloudinary.com/dm3gsotk5/image/upload/v1756913943/policy-1_b6xkhg.jpg";

// Base Cloudinary URL for optimization
const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/dm3gsotk5/image/upload";

// Optimized Cloudinary images with transformations for better performance
export const OPTIMIZED_IMAGES = {
  hero: {
    mobile: `${CLOUDINARY_BASE_URL}/f_auto,q_auto,w_768,c_fill,g_auto/v1756913943/policy-1_b6xkhg.jpg`,
    tablet: `${CLOUDINARY_BASE_URL}/f_auto,q_auto,w_1024,c_fill,g_auto/v1756913943/policy-1_b6xkhg.jpg`,
    desktop: `${CLOUDINARY_BASE_URL}/f_auto,q_auto,w_1920,c_fill,g_auto/v1756913943/policy-1_b6xkhg.jpg`,
    webp: `${CLOUDINARY_BASE_URL}/f_webp,q_auto,w_1920,c_fill,g_auto/v1756913943/policy-1_b6xkhg.jpg`
  }
};