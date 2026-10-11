// Approved proposal. Deployment and live product creation still require release approval.
export const BASIC_PRICE = '$2.99';
export const PLUS_PRICE = '$9.99';
export const PLANS = {
  basic: { name: 'Custom Basic', price: BASIC_PRICE, credits: 1 },
  plus: { name: 'Custom Plus', price: PLUS_PRICE, credits: 8 },
} as const;
export type Plan = keyof typeof PLANS;
