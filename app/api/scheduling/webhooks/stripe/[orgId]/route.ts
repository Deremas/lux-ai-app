import { NextResponse } from "next/server";
import { Stripe } from "stripe";

import { writeAudit } from "@/lib/scheduling/audit";
import { isValidUuid } from "@/lib/validation";
import { getStripeForOrg, getStripeWebhookSecretForOrg } from "@/lib/stripe";

type Params = {
  params: {
    orgId?: string;
  };
};

export async function POST(req: Request, { params }: Params) {
  const orgId = params?.orgId ?? "";
  if (!orgId || !isValidUuid(orgId)) {
    return NextResponse.json({ error: "Invalid orgId" }, { status: 400 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const stripe = await getStripeForOrg(orgId);
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const webhookSecret = await getStripeWebhookSecretForOrg(orgId);
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook secret not configured" },
      { status: 400 }
    );
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Invalid";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await writeAudit({
      orgId,
      actorUserId: null,
      entityType: "stripe_webhook",
      entityId: event.id,
      action: event.type,
      before: null,
      after: {
        livemode: event.livemode,
        created: event.created,
        type: event.type,
      },
    });
  } catch (err) {
    console.error("stripe webhook audit failed", err);
  }

  return NextResponse.json({ received: true });
}

