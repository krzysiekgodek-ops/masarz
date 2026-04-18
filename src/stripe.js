export const STRIPE_PLANS = [
  { id: 'mini',  label: 'Mini',  price: '10 zł / rok', paymentLink: import.meta.env.VITE_STRIPE_LINK_MINI,  limit: 15   },
  { id: 'midi',  label: 'Midi',  price: '20 zł / rok', paymentLink: import.meta.env.VITE_STRIPE_LINK_MIDI,  limit: 30   },
  { id: 'maxi',  label: 'Maxi',  price: '30 zł / rok', paymentLink: import.meta.env.VITE_STRIPE_LINK_MAXI,  limit: 100  },
  { id: 'vip',   label: 'VIP',   price: '50 zł / rok', paymentLink: import.meta.env.VITE_STRIPE_LINK_VIP,   limit: 9999 },
];
