import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { updateUserSubscription, cancelUserSubscription, updatePaymentStatus } from '../api/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature']!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf.toString(), sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    let userId: string | undefined;
    let subscriptionId: string | undefined;

    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        userId = checkoutSession.client_reference_id ?? undefined;
        subscriptionId = checkoutSession.subscription as string | undefined;
        if (userId && subscriptionId) {
          await updateUserSubscription(userId, 'premium', subscriptionId);
        }
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        userId = subscription.metadata?.userId;
        if (userId) {
          await updateUserSubscription(userId, 'premium', subscription.id);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        userId = deletedSubscription.metadata?.userId;
        if (userId) {
          await cancelUserSubscription(userId);
        }
        break;

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        const invoice = event.data.object as Stripe.Invoice;
        userId = invoice.metadata?.userId;
        if (userId) {
          await updatePaymentStatus(userId, event.type === 'invoice.payment_succeeded');
        }
        break;

      case 'customer.subscription.trial_will_end':
        // Implement logic to notify user about trial ending
        break;

      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        userId = paymentIntent.metadata?.userId;
        if (userId) {
          await updatePaymentStatus(userId, event.type === 'payment_intent.succeeded');
        }
        break;
    }

    res.json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}