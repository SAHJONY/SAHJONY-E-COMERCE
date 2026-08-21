import Link from "next/link";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

export default function NotFound() {
  return <main className="bag-page" id="main-content"><SiteHeader tone="light" /><section className="bag-empty"><p>404 / NOT FOUND</p><h1>This one slipped away.</h1><span>The page may have moved, but the edit is waiting.</span><Link className="button-dark" href="/discover">DISCOVER SAHJONY</Link></section><SiteFooter /></main>;
}
