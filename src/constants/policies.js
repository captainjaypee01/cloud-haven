export const RESORT_POLICIES = {
  child: {
    title: "Child Policy",
    description: "Our policies for children of different age groups",
    policies: [
      {
        category: "3 years old and below",
        rules: [
          "Free of charge for entrance fee",
          "Allowed to share bed with accompanying adults at no additional cost",
          "Not required to avail of buffet but may share food from adults' plates"
        ]
      },
      {
        category: "4 to 6 years old",
        rules: [
          "Buffet rate: ₱1,000 per person (Adult rate: ₱1,700)"
        ]
      },
      {
        category: "7 years old and above",
        rules: [
          "Same rate as adult: ₱1,700 per person"
        ]
      }
    ]
  },
  
  accommodation: {
    title: "Hotel Rooms Reminders",
    description: "Important information about room accommodations and policies",
    policies: [
      {
        category: "Check-in/Check-out",
        rules: [
          "CHECK IN: 3:00 PM",
          "CHECK OUT: 1:00 PM"
        ]
      },
      {
        category: "Restaurant Services",
        rules: [
          "We have restaurant inside the resort",
          "You can order through the resort restaurant menu an hour in advance"
        ]
      },
      {
        category: "Food Policies",
        rules: [
          "Bringing food is not allowed inside the hotel rooms/resort",
          "You are allowed to bring snacks, chips, bread, pizza, fruits, fast food meal, liquor and drinks - NO CORKAGE",
          "Bringing Lechon (with corkage fee = ₱2,500)"
        ]
      }
    ]
  },
  
  buffet: {
    title: "Terms & Condition for Buffet",
    description: "Buffet schedules and dining policies",
    policies: [
      {
        category: "Buffet Timings",
        rules: [
          "DINNER: 6:30 PM - 8:00 PM",
          "BREAKFAST: 6:30 AM - 8:00 AM",
          "LUNCH: 11:30 AM - 1:00 PM"
        ]
      },
      {
        category: "Dining Rules",
        rules: [
          "Food items have to be consumed only within the premises",
          "Take out is not allowed",
          "It's not possible to get food for pulutan"
        ]
      }
    ]
  },
  
  resort: {
    title: "Resort Policies",
    description: "General resort rules and guidelines",
    policies: [
      {
        category: "General Rules",
        rules: [
          "Proper swimwear is required in the pool area",
          "Outside food and beverages are not allowed within the resort premises",
          "Quiet hours are from 10:00 PM to 7:00 AM"
        ]
      },
      {
        category: "Safety & Courtesy",
        rules: [
          "Please respect other guests by keeping noise to a minimum during quiet hours",
          "Follow all posted safety guidelines",
          "Report any issues to resort staff immediately"
        ]
      }
    ]
  },
  
  pet: {
    title: "Pet Policy",
    description: "Guidelines for guests bringing pets",
    policies: [
      {
        category: "Pet Requirements",
        rules: [
          "Small pets (up to 10 kg) are allowed in designated rooms only",
          "Cleaning fee applies per stay",
          "Pets must be on a leash in common areas"
        ]
      },
      {
        category: "Pet Restrictions",
        rules: [
          "Aggressive pets are not permitted",
          "Pets must not disturb other guests",
          "Pet owners are responsible for any damages"
        ]
      }
    ]
  }
};

export const POLICY_ICONS = {
  child: "👶",
  accommodation: "🏨",
  buffet: "🍽️",
  resort: "🏖️",
  pet: "🐕"
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