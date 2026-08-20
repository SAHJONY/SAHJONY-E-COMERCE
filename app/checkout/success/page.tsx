import Link from 'next/link';
import { getStripe } from '@/lib/stripe';
import ClearBag from './ClearBag';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ session_id?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  let paid = false;

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      paid = session.payment_status === 'paid';
    } catch {
      paid = false;
    }
  }

  return <main className="bag-page"><nav className="nav pdp-nav"><Link className="wordmark" href="/">SAHJONY</Link><div className="nav-actions"><Link href="/discover">CONTINUE SHOPPING</Link></div></nav>{paid ? <section className="bag-empty"><ClearBag/><p>ORDER RECEIVED</p><h1>Thank you.</h1><span>Your payment is confirmed. SAHJONY will send fulfillment details to the email used at checkout.</span><Link className="button-dark" href="/">RETURN TO SAHJONY</Link></section> : <section className="bag-empty"><p>PAYMENT STATUS</p><h1>Not confirmed yet.</h1><span>We could not verify a completed payment for this session. Your bag has not been cleared.</span><Link className="button-dark" href="/checkout">RETURN TO CHECKOUT</Link></section>}</main>;
}
