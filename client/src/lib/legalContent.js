// All copy for the Contact, Terms and Privacy pages. `{email}` in a paragraph is
// rendered as a mailto link to CONTACT_EMAIL (one source for every page).

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'thriftpedia@gmail.com';

export const LAST_UPDATED = '14 November 2026';

export const CONTACT_INTRO = 'Questions about a piece or an order? Reach the team below.';
export const CONTACT_REPLY_NOTE = 'We reply within 1–2 days.';

export const TEAM = [
  { name: 'Nayla Thalita', role: 'Wishlist, review, API security' },
  { name: 'Akio Afifian Ahsan', role: 'Orders' },
  { name: 'Zahra Elfatima', role: 'Products and catalog' },
  { name: 'Rida Larasati', role: 'Authentication' },
];

export const TERMS_SECTIONS = [
  {
    id: 'about-the-service',
    title: 'About the service',
    body: [
      'Thriftpedia is a curated place to discover and buy pre-loved fashion. By using the service, you agree to these terms and to provide accurate information when you shop.',
    ],
  },
  {
    id: 'accounts',
    title: 'Accounts',
    body: [
      'Keep your account details accurate and your password private. You are responsible for activity on your account; contact the team if you notice access you do not recognise.',
    ],
  },
  {
    id: 'one-of-a-kind-items',
    title: 'One-of-a-kind items',
    body: [
      'Each piece is unique and available once. After purchase it is marked Sold and cannot be bought again. Check the photos, size and condition before ordering.',
    ],
  },
  {
    id: 'orders-and-cancellation',
    title: 'Orders and cancellation',
    body: [
      'An item is not reserved by adding it to your wishlist. You can cancel an order yourself while it is Pending. Once it is shipped it cannot be cancelled or returned.',
    ],
  },
  {
    id: 'reviews',
    title: 'Reviews',
    body: [
      'Reviews can be written only by buyers whose order is Completed, one review per item. Keep feedback honest and respectful; content that breaks these rules may be removed.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    body: [
      'For questions about these terms or an order, email {email}. Include your order number when relevant, but never send your password or payment credentials.',
    ],
  },
];

export const PRIVACY_SECTIONS = [
  {
    id: 'data-we-collect',
    title: 'Data we collect',
    body: [
      'We collect the details you provide when you create an account: your name, email and password. We also keep your order history, wishlist and the reviews you write to support the service.',
    ],
  },
  {
    id: 'how-we-use-it',
    title: 'How we use it',
    body: [
      'We use your information to manage accounts, fulfil orders and respond to your questions. It also helps us maintain wishlists and reviews, improve the service and prevent misuse.',
    ],
  },
  {
    id: 'storage-and-security',
    title: 'Storage and security',
    body: [
      'We keep personal information only for as long as it is needed to provide the service or meet applicable obligations. Passwords are stored as hashes, never as plain text, and product photos are stored with an image hosting service.',
      'We use access controls and reasonable safeguards to protect your information, but no method of online storage or transmission is completely secure.',
    ],
  },
  {
    id: 'your-choices',
    title: 'Your choices',
    body: [
      'You can manage your wishlist from your account. To request access, correction or deletion of your personal information, contact the team; some order records may need to be retained to meet legal obligations.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    body: [
      'For privacy questions or requests about your information, email {email}. Tell us what you need without including your password, payment credentials or other sensitive information.',
    ],
  },
];
