// pages/api/verify-payment.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_WEBHOOK_SECRET!, { apiVersion: '2024-06-20' });
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { sessionId } = req.body;

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid') {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'Payment not completed' });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ success: false, message: 'Error verifying payment' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}