import Link from "next/link";
import BagView from "@/app/components/BagView";

export default function BagPage() {
  return <main className="bag-page"><nav className="nav pdp-nav"><Link className="nav-back" href="/">← CONTINUE SHOPPING</Link><Link className="wordmark" href="/">SAHJONY</Link><div className="nav-actions"><Link href="/#shop">THE EDIT</Link><a href="mailto:clientservices@sahjony.com">CLIENT SERVICES</a></div></nav><BagView /></main>;
}
