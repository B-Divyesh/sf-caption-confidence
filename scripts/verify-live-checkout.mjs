const checkoutUrl = process.env.CAPTION_CONFIDENCE_CHECKOUT_URL
  ?? 'https://api.sociobot.in/api/v1/products/caption-confidence/checkout';

const response = await fetch(checkoutUrl, {
  redirect: 'manual',
  headers: { 'user-agent': 'caption-confidence-release-verifier/1.0' },
  signal: AbortSignal.timeout(30_000)
});

const location = response.headers.get('location');
if (response.status < 300 || response.status >= 400 || !location) {
  const body = (await response.text()).slice(0, 500);
  throw new Error(
    `Checkout is unavailable: expected an HTTP redirect from ${checkoutUrl}, received ${response.status}`
    + `${body ? ` ${body}` : ''}`
  );
}

const destination = new URL(location, checkoutUrl);
if (
  destination.protocol !== 'https:'
  || destination.hostname !== 'checkout.dodopayments.com'
  || !destination.pathname.startsWith('/session/')
) {
  throw new Error(`Checkout returned an unexpected hosted-checkout redirect: ${destination.origin}${destination.pathname}`);
}

console.log(`Checkout available: ${response.status} ${destination.origin}${destination.pathname}`);
