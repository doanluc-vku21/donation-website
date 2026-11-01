# Akram direct payment button labels — 2026-11-02

The user supplied reference screenshots for two button updates on
`/akram-shake-1`:

- Amount step: “Pay {amount} with Card or Apple Pay”, with card and Apple Pay
  artwork and the existing forward arrow. The amount remains the current total,
  formatted in the selected currency. The caption underneath uses the existing
  secure-Stripe wording.
- Donor-information step: “Continue to Secure Payment”. Loading/disabled states
  and the requirement for a valid email are retained.

All five languages are covered. Decorative icons are hidden from accessibility
names, the label may wrap on narrow screens, and the arrow cannot consume the
text's available width. The Apple silhouette is from MIT-licensed Bootstrap
Icons, with the notice retained in its component.

This changes presentation only. It does not add a native wallet button, create a
hidden Checkout Session, confirm payment, or change the Hosted Checkout flow.
Stripe continues to determine wallet availability in Checkout. Other entry pages
retain their existing button labels.

ESLint with zero warnings, type checking, and 73 existing payment/form regression
tests pass. No real charge or donor email is used for validation. Release uses
the existing authorized Vercel workflow; rollback is the preceding deployment
for commit `f809edd`.
