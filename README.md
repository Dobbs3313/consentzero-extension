# ConsentZero

> **100% Local Cookie Banner Auto-Rejector with Transparent Audit Log**

A fast, privacy-first Chrome Manifest V3 extension built by **ARIS PARTY LLC** to outperform **I don't care about cookies** (`fihnjjcciajhdojfnbdddfaoknhalnja`, 800K+ users, 2.9★).

- **Product Page:** https://arisparty.org/extensions/consentzero
- **Privacy Policy:** https://arisparty.org/extensions/consentzero/privacy
- **Support & Setup:** https://arisparty.org/extensions/consentzero/support (`support@arisparty.org`)

## Competitive Advantages
- Replaces I don't care about cookies (800K users, 2.9★, owned by Gen Digital/Avast)
- Removes Avast analytics telemetry (analytics.avcdn.net) completely — 100% local execution
- Prioritizes REJECTING tracking cookies rather than silently accepting everything
- Under 50KB vs incumbent 1.8MB with full per-site audit transparency

## Free vs ConsentZero Pro
### Free
- 100% local privacy-first cookie banner auto-rejector (clicks Reject/Necessary instead of blind Accept)
- Zero idle CPU — lightweight targeted MutationObserver that auto-stops after handling
- Element-safe selectors that never break legitimate chat widgets or navigation bars
- Transparent per-site action log showing exact action taken + 1-click pause/allowlist
- Zero telemetry or third-party analytics

### Pro (Monetized via Stripe)
- Custom CSS / button-text rules per site
- Per-domain policy override (Reject, Accept Essential, or Hide Only)
- Newsletter & sticky overlay declutter mode
- Detailed blocked-banner stats & JSON rule import/export

| Plan | Price | Stripe Product / Price ID | Live Checkout Link |
|---|---|---|---|
| Monthly | $2.99/mo | `price_1UeE3EFtqvN4GZH3HHjrq2hv` | [Checkout](https://buy.stripe.com/14A28r3Fd8FXfGDdH4g3604) |
| Yearly | $19.99/yr | `price_1UeE43FtqvN4GZH3Tba8aZNN` | [Checkout](https://buy.stripe.com/5kQ6oH4JhaO5gKHgTgg360e) |
| Lifetime | $29.99 one-time | `price_1UeE5MFtqvN4GZH3vrcFQ92w` | [Checkout](https://buy.stripe.com/fZu6oHdfN2hzamjbyWg360o) |

- **Stripe Product ID:** `prod_VfZArgHBYmhP1Z`

## Local Installation (Chrome)
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this repository root

## Verification & Chrome Web Store Packaging
```bash
node tests/verify.mjs .
```
Outputs a store-ready archive with 56 `_locales` at `dist/consentzero-extension-v1.0.0.zip`.
