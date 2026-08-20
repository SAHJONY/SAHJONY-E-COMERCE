import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return <main className="bag-page"><nav className="nav pdp-nav"><Link className="wordmark" href="/">SAHJONY</Link><div className="nav-actions"><Link href="/discover">CONTINUE SHOPPING</Link></div></nav><section className="bag-empty"><p>ORDER RECEIVED</p><h1>Thank you.</h1><span>Your payment was submitted successfully. SAHJONY will confirm availability and fulfillment details by email.</span><Link className="button-dark" href="/">RETURN TO SAHJONY</Link></section></main>;
}
