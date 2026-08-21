import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><Link className="wordmark" href="/">SAHJONY</Link><p>Premium brands. Exceptional value.</p></div>
      <div className="footer-group"><p>DISCOVER</p><Link href="/discover">Shop all</Link><Link href="/collections/bags-leather">Bags & leather</Link><Link href="/collections/timepieces">Timepieces</Link><Link href="/collections/footwear">Footwear</Link></div>
      <div className="footer-group"><p>CLIENT CARE</p><Link href="/client-services">Client services</Link><Link href="/authenticity">Authenticity</Link><Link href="/shipping-returns">Shipping & returns</Link></div>
      <div className="footer-group"><p>LEGAL</p><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:clientservices@sahjony.com">Contact</a></div>
      <div className="footer-bottom"><span>© 2026 SAHJONY</span><span>Independent multi-brand retailer</span><a href="#top">BACK TO TOP ↑</a></div>
    </footer>
  );
}
