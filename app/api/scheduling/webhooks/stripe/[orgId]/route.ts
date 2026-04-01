import crypto from "crypto";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { Stripe } from "stripe";

import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/scheduling/audit";
import {
  markBookingAttemptPaid,
  markBookingAttemptPaymentFailed,
} from "@/lib/scheduling/paid-booking";
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

  const existing = await prisma.stripeEvent.findUnique({
    where: { eventId: event.id },
    select: { id: true, processedAt: true, status: true },
  });
  if (existing?.processedAt || existing?.status === "processed") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  let stripeEventId = existing?.id ?? null;
  if (!stripeEventId) {
    try {
      const created = await prisma.stripeEvent.create({
        data: {
          id: crypto.randomUUID(),
          orgId,
          eventId: event.id,
          eventType: event.type,
          status: "processing",
          livemode: event.livemode,
          payload: JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue,
        },
        select: { id: true },
      });
      stripeEventId = created.id;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const concurrent = await prisma.stripeEvent.findUnique({
          where: { eventId: event.id },
          select: { id: true, processedAt: true, status: true },
        });
        if (concurrent?.processedAt || concurrent?.status === "processed") {
          return NextResponse.json({ received: true, duplicate: true });
        }
        stripeEventId = concurrent?.id ?? null;
      } else {
        throw err;
      }
    }
  }

  let handling: unknown = { ignored: true };
  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingAttemptId =
        typeof paymentIntent.metadata?.bookingAttemptId === "string"
          ? paymentIntent.metadata.bookingAttemptId.trim()
          : "";

      if (bookingAttemptId) {
        handling = await markBookingAttemptPaid({
          attemptId: bookingAttemptId,
          stripeEventId: event.id,
          stripePaymentIntentId: paymentIntent.id,
          amountCents: paymentIntent.amount_received ?? paymentIntent.amount ?? 0,
          currency: paymentIntent.currency ?? "",
        });
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingAttemptId =
        typeof paymentIntent.metadata?.bookingAttemptId === "string"
          ? paymentIntent.metadata.bookingAttemptId.trim()
          : "";

      if (bookingAttemptId) {
        handling = await markBookingAttemptPaymentFailed({
          attemptId: bookingAttemptId,
          stripeEventId: event.id,
          stripePaymentIntentId: paymentIntent.id,
        });
      }
    } else if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingAttemptId =
        typeof session.metadata?.bookingAttemptId === "string"
          ? session.metadata.bookingAttemptId.trim()
          : "";

      if (bookingAttemptId) {
        await prisma.paymentRecord.updateMany({
          where: {
            bookingAttemptId,
            provider: "stripe",
          },
          data: {
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            lastStripeEventId: event.id,
          },
        });
        await prisma.bookingAttempt.updateMany({
          where: {
            id: bookingAttemptId,
            status: "payment_pending",
          },
          data: {
            status: "payment_processing",
          },
        });
        handling = { handled: true, success: true, sessionId: session.id };
      }
    }

    if (stripeEventId) {
      await prisma.stripeEvent.update({
        where: { id: stripeEventId },
        data: {
          status: "processed",
          lastError: null,
          processedAt: new Date(),
          payload: JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue,
        },
      });
    }
  } catch (err) {
    console.error("stripe webhook processing failed", err);
    if (stripeEventId) {
      await prisma.stripeEvent.update({
        where: { id: stripeEventId },
        data: {
          status: "failed",
          lastError:
            err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error",
          payload: JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue,
        },
      });
    }
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
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
        handling,
      },
    });
  } catch (err) {
    console.error("stripe webhook audit failed", err);
  }

  return NextResponse.json({ received: true });
}
