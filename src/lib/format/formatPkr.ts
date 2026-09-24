const pkrNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** 1250 → "Rs. 1,250" */
export function formatPkr(amount: number): string {
  return `Rs. ${pkrNumber.format(Math.round(amount))}`;
}
