export const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Hire Trainers', href: '#hire-trainers' },
  { label: 'Subscription', href: '#subscription' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact Us', href: '#contact' },
];

export const FEATURES = [
  {
    title: 'Member Management',
    description:
      'Add, edit, track and manage all gym members with detailed profiles, photos, documents, and membership status in one place.',
    icon: 'users',
  },
  {
    title: 'Subscription Tracking',
    description:
      'Create flexible course packages, track membership renewals, handle early/late renewals, and never miss an expiry date.',
    icon: 'creditCard',
  },
  {
    title: 'Trainer Management',
    description:
      'Manage trainers, assign PT members, track salary history, and streamline trainer operations all in one place.',
    icon: 'calendarCheck',
  },
  {
    title: 'Member & Trainer Panel',
    description:
      'Dedicated login portals for members and trainers. Members can view diet plans, exercise plans & membership details. Trainers can manage PT members, view salary history & download slips.',
    icon: 'wallet',
  },
  {
    title: 'Diet & Exercise Plans',
    description:
      'Create reusable diet templates with 6 daily meals, build day-wise workout plans, and assign them to members instantly.',
    icon: 'dumbbell',
  },
  {
    title: 'Reports & Analytics',
    description:
      'Dashboard insights on active members, revenue, expenses, expiring memberships, trainer salaries, and more.',
    icon: 'barChart',
  },
];

export const PLANS = [
  {
    name: 'Starter',
    price: '4,999',
    period: '/year',
    description: 'Perfect for small gyms getting started',
    popular: false,
    features: [
      'Up to 100 Members',
      'Member Management',
      'Course Packages',
      'Membership Renewals',
      'Balance Payments',
      'Basic Dashboard',
      'Member Inquiries',
      'Email Support',
    ],
  },
  {
    name: 'Professional (Silver)',
    price: '7,999.00',
    period: '/year (365 days)',
    description: 'Best for growing gyms — up to 3,000 members with PT services',
    popular: true,
    features: [
      'Up to 3,000 Members',
      'Up to 10 Trainers',
      'PT Membership Module',
      'Member & Trainer Portals',
      'Unlimited Course Packages',
      'Diet & Exercise Plans',
      'Salary & Payroll',
      'Income & Expense Reports',
      'Excel Export & Photo Upload',
      'BMI Calculator & Inquiries',
      'WhatsApp Messages',
      'Priority Support',
    ],
  },
  {
    name: 'Enterprise',
    price: '11,999',
    period: '/year',
    description: 'For large gyms needing full control',
    popular: false,
    features: [
      'Unlimited Members',
      'Everything in Professional',
      'Biometric Integration',
      'Advanced Reports',
      'Multi-device Attendance',
      'Bulk SMS / WhatsApp',
      'Export to Excel / PDF',
      'Dedicated Account Manager',
      'Custom Branding',
    ],
  },
];

export const TESTIMONIALS = [
  {
    name: 'Rohit Gujjar',
    role: 'Owner, Rudra Fitness Gym',
    text: 'Gym Desk Pro has completely transformed how we manage our 300+ members. The attendance tracking and salary settlement features save us hours every month.',
    avatar: 'RG',
  },
  {
    name: 'Sanatan',
    role: 'Owner, King Fitness',
    text: 'The diet plan and exercise plan features are exactly what we needed. Our trainers love how easy it is to assign plans to members.',
    avatar: 'S',
  },
  {
    name: 'Vikram Singh',
    role: 'Owner, Iron Paradise',
    text: 'Membership renewals and balance payment tracking used to be a nightmare. Now it is all automated and I can see everything from the dashboard.',
    avatar: 'VS',
  },
];

export const FAQS = [
  {
    question: 'How do I get started with Gym Desk Pro?',
    answer:
      'Simply choose a subscription plan, and our team will set up your gym account. You can start adding trainers and members immediately. We also provide a guided onboarding session.',
  },
  {
    question: 'Can my trainers and members also log in?',
    answer:
      'Yes! Trainers can log in to view their assigned PT members, salary history, and download salary slips. Members can view their membership details, diet plans, exercise plans, and attendance history.',
  },
  {
    question: 'What payment modes are supported?',
    answer:
      'Gym Desk Pro supports Cash, Card, UPI, Bank Transfer, Cheque, Net Banking, and Online payments. You can also track partial payments and pending balances.',
  },
  {
    question: 'Is there a mobile app?',
    answer:
      'Coming soon.',
  },
  {
    question: 'Can I export my data?',
    answer:
      'Yes! You can export member lists to Excel, download salary slips as PDF, and generate detailed expense and income reports.',
  },
  {
    question: 'What about biometric attendance?',
    answer:
      'Coming soon.',
  },
];
