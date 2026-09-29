export function formatUsd(
  cents: number,
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    },
  ).format(
    cents / 100,
  );
}

export function calculateFeeContribution(
  amountCents: number,
) {
  return Math.round(
    amountCents * 0.029 + 30,
  );
}

export function progressPercent(
  raisedCents: number,
  goalCents: number,
) {
  if (
    goalCents <= 0
  ) {
    return 0;
  }

  const percent =
    (raisedCents /
      goalCents) *
    100;

  // 0 donation
  if (
    raisedCents <= 0
  ) {
    return 0;
  }

  // Có donation nhưng chưa tới 1%
  // thì vẫn hiển thị số thập phân.
  if (
    percent < 1
  ) {
    return Number(
      percent.toFixed(1),
    );
  }

  // Từ 1% trở lên dùng số nguyên.
  return Math.round(
    percent,
  );
}