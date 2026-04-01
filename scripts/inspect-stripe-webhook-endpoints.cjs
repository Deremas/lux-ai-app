require("dotenv").config();

const Stripe = require("stripe");

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
  const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });

  console.log(
    JSON.stringify(
      {
        checkedAtUtc: new Date().toISOString(),
        mode: secretKey.startsWith("sk_test_")
          ? "test"
          : secretKey.startsWith("sk_live_")
            ? "live"
            : "unknown",
        endpointCount: endpoints.data.length,
        endpoints: endpoints.data.map((item) => ({
          id: item.id,
          url: item.url,
          status: item.status,
          livemode: item.livemode,
          enabledEvents: item.enabled_events,
          secretLast4: item.secret ? item.secret.slice(-4) : null,
        })),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("inspect-stripe-webhook-endpoints failed");
  if (error && error.raw) {
    console.error(JSON.stringify(error.raw, null, 2));
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exit(1);
});
