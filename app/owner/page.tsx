'use client';

import { FormEvent, useEffect, useState } from 'react';

// Owner Operations Dashboard: environment-gated and session-token protected.
type Readiness = {
  ready?: boolean;
  verifiedSellableProducts?: number;
  checks?: Record<string, boolean>;
};

type Product = {
  slug?: string;
  sku?: string;
  brand?: string;
  name?: string;
  inventory_quantity?: number;
  is_active?: boolean;
  source_verified?: boolean;
};

type Order = {
  id?: string;
  order_number?: string;
  email?: string;
  payment_status?: string;
  fulfillment_status?: string;
  total_cents?: number;
  currency?: string;
  created_at?: string;
};

export default function OwnerPage() {
  const [token, setToken] = useState('');
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('sahjony-owner-token') || '';
    if (saved) {
      setToken(saved);
      void loadOwnerData(saved);
    } else {
      void loadReadiness();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReadiness() {
    try {
      const response = await fetch('/api/readiness', { cache: 'no-store' });
      setReadiness(await response.json());
    } catch {
      setReadiness(null);
    }
  }

  async function loadOwnerData(ownerToken: string) {
    setLoading(true);
    setError('');
    await loadReadiness();

    try {
      const headers = { 'x-owner-token': ownerToken };
      const [catalogResponse, ordersResponse] = await Promise.all([
        fetch('/api/owner/catalog', { headers, cache: 'no-store' }),
        fetch('/api/owner/orders', { headers, cache: 'no-store' }),
      ]);

      if (catalogResponse.status === 401 || ordersResponse.status === 401) {
        sessionStorage.removeItem('sahjony-owner-token');
        setAuthorized(false);
        setProducts([]);
        setOrders([]);
        setError('Owner credentials were not accepted.');
        return;
      }

      if (!catalogResponse.ok || !ordersResponse.ok) {
        setAuthorized(false);
        setError('Owner operations are not fully configured in this environment.');
        return;
      }

      const catalog = await catalogResponse.json();
      const orderData = await ordersResponse.json();
      setProducts(Array.isArray(catalog.products) ? catalog.products : []);
      setOrders(Array.isArray(orderData.orders) ? orderData.orders : []);
      setAuthorized(true);
      sessionStorage.setItem('sahjony-owner-token', ownerToken);
    } catch {
      setAuthorized(false);
      setError('Unable to reach owner operations.');
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (token.trim()) void loadOwnerData(token.trim());
  }

  function signOut() {
    sessionStorage.removeItem('sahjony-owner-token');
    setToken('');
    setProducts([]);
    setOrders([]);
    setAuthorized(false);
    setError('');
  }

  const sellable = products.filter((p) => p.is_active && p.source_verified && Number(p.inventory_quantity || 0) > 0).length;
  const openOrders = orders.filter((o) => o.fulfillment_status !== 'delivered' && o.fulfillment_status !== 'canceled').length;
  const gross = orders.reduce((sum, o) => sum + Number(o.total_cents || 0), 0) / 100;

  return (
    <main style={{ minHeight: '100vh', background: '#050505', color: '#fff', padding: '48px 6vw 80px', fontFamily: 'DM Sans, Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, borderBottom: '1px solid #242424', paddingBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.24em', color: '#c4a775', marginBottom: 10 }}>SAHJONY / OWNER OPERATIONS</div>
          <h1 style={{ fontSize: 'clamp(36px,5vw,72px)', margin: 0, fontWeight: 400, letterSpacing: '-.05em' }}>Commerce Command Center</h1>
        </div>
        <a href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 10, letterSpacing: '.16em' }}>STOREFRONT ↗</a>
      </div>

      {!authorized ? (
        <section style={{ maxWidth: 620, marginTop: 72, padding: 34, border: '1px solid #252525', background: '#0c0c0c' }}>
          <div style={{ color: '#c4a775', fontSize: 10, letterSpacing: '.2em', marginBottom: 12 }}>PRIVATE ACCESS</div>
          <h2 style={{ fontSize: 32, fontWeight: 400, margin: '0 0 14px' }}>Enter owner operations token</h2>
          <p style={{ color: '#9a958c', lineHeight: 1.7, marginBottom: 26 }}>The token is stored only for this browser session. Orders and internal catalog data remain inaccessible without valid owner credentials.</p>
          <form onSubmit={submit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="OWNER_OPERATIONS_TOKEN"
              autoComplete="off"
              style={{ flex: '1 1 320px', minWidth: 0, padding: '15px 16px', background: '#111', border: '1px solid #343434', color: '#fff', outline: 'none' }}
            />
            <button disabled={loading} style={{ padding: '15px 22px', border: 0, background: '#f5f2ea', color: '#050505', fontWeight: 600, letterSpacing: '.12em', cursor: 'pointer' }}>
              {loading ? 'CONNECTING…' : 'ENTER'}
            </button>
          </form>
          {error ? <p style={{ color: '#e2a2a2', marginTop: 18 }}>{error}</p> : null}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #222', color: '#777', fontSize: 12 }}>
            Platform readiness: {readiness?.ready ? 'READY' : 'NOT READY'} · Verified sellable products: {readiness?.verifiedSellableProducts ?? 0}
          </div>
        </section>
      ) : (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginTop: 48 }}>
            {[
              ['PLATFORM', readiness?.ready ? 'READY' : 'GATED'],
              ['CATALOG', String(products.length)],
              ['SELLABLE SKUS', String(sellable)],
              ['OPEN ORDERS', String(openOrders)],
              ['ORDER VALUE', `$${gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#0c0c0c', border: '1px solid #202020', padding: 24 }}>
                <div style={{ color: '#777', fontSize: 9, letterSpacing: '.18em', marginBottom: 12 }}>{label}</div>
                <div style={{ fontSize: 30, letterSpacing: '-.04em' }}>{value}</div>
              </div>
            ))}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 18, marginTop: 28 }}>
            <div style={{ background: '#0b0b0b', border: '1px solid #202020', padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 400 }}>Catalog Control</h2>
                <span style={{ color: '#c4a775', fontSize: 10 }}>{products.length} RECORDS</span>
              </div>
              <div style={{ marginTop: 22, display: 'grid', gap: 10 }}>
                {products.slice(0, 8).map((product) => (
                  <div key={product.slug || product.sku} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, padding: '12px 0', borderBottom: '1px solid #1e1e1e' }}>
                    <div>
                      <div style={{ fontSize: 13 }}>{product.brand} {product.name}</div>
                      <div style={{ color: '#777', fontSize: 10, marginTop: 4 }}>{product.sku || 'NO SKU'} · stock {Number(product.inventory_quantity || 0)}</div>
                    </div>
                    <div style={{ color: product.is_active && product.source_verified ? '#9bc6a2' : '#bda46e', fontSize: 10 }}>
                      {product.is_active && product.source_verified ? 'LIVE' : 'HOLD'}
                    </div>
                  </div>
                ))}
                {!products.length ? <div style={{ color: '#777', padding: '18px 0' }}>No internal catalog records yet.</div> : null}
              </div>
            </div>

            <div style={{ background: '#0b0b0b', border: '1px solid #202020', padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 400 }}>Order Operations</h2>
                <span style={{ color: '#c4a775', fontSize: 10 }}>{orders.length} ORDERS</span>
              </div>
              <div style={{ marginTop: 22, display: 'grid', gap: 10 }}>
                {orders.slice(0, 8).map((order) => (
                  <div key={order.id || order.order_number} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, padding: '12px 0', borderBottom: '1px solid #1e1e1e' }}>
                    <div>
                      <div style={{ fontSize: 13 }}>{order.order_number || 'ORDER'}</div>
                      <div style={{ color: '#777', fontSize: 10, marginTop: 4 }}>{order.email} · {order.fulfillment_status || 'unfulfilled'}</div>
                    </div>
                    <div style={{ fontSize: 11 }}>${(Number(order.total_cents || 0) / 100).toFixed(2)}</div>
                  </div>
                ))}
                {!orders.length ? <div style={{ color: '#777', padding: '18px 0' }}>No customer orders yet.</div> : null}
              </div>
            </div>
          </section>

          <section style={{ marginTop: 28, padding: 28, border: '1px solid #202020', background: '#0b0b0b' }}>
            <h2 style={{ margin: '0 0 18px', fontSize: 24, fontWeight: 400 }}>Launch Readiness</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
              {Object.entries(readiness?.checks || {}).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, borderBottom: '1px solid #1e1e1e', padding: '10px 0', fontSize: 11 }}>
                  <span style={{ color: '#aaa' }}>{key}</span>
                  <strong style={{ color: value ? '#9bc6a2' : '#bda46e' }}>{value ? 'PASS' : 'GATED'}</strong>
                </div>
              ))}
            </div>
          </section>

          <button onClick={signOut} style={{ marginTop: 24, background: 'transparent', border: '1px solid #333', color: '#aaa', padding: '12px 16px', cursor: 'pointer', letterSpacing: '.12em' }}>END OWNER SESSION</button>
        </>
      )}
    </main>
  );
}
