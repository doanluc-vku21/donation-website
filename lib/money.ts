export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function calculateFeeContribution(amountCents: number) {
  return Math.round(amountCents * 0.029 + 30);
}

export function progressPercent(raisedCents: number, goalCents: number) {
  if (goalCents <= 0) return 0;
  return Math.round((raisedCents / goalCents) * 100);
}
