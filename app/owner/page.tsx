'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import './owner.css';

type Readiness = { ready?: boolean; verifiedSellableProducts?: number; checks?: Record<string, boolean> };
type Row = Record<string, any>;
type CommandCenter = {
  generatedAt?: string;
  executive?: Row;
  inventory?: Row;
  fulfillment?: Row;
  procurement?: Row;
  analytics?: Row;
  finance?: Row;
  recentOrders?: Row[];
  topProducts?: Row[];
  tasks?: Row[];
  audit?: Row[];
};

type Product = { slug?: string; sku?: string; brand?: string; name?: string; inventory_quantity?: number; is_active?: boolean; source_verified?: boolean; price_cents?: number };
type Candidate = { id?: string; candidate_code?: string; priority?: number; category?: string; brand?: string; proposed_name?: string; manufacturer_sku?: string; status?: string; evidence_status?: string; supplier_name?: string; supplier_status?: string; supplier_source_type?: string };

const tabs = ['overview','orders','catalog','inventory','procurement','customers','finance','analytics','audit','system'] as const;
const tabLabels: Record<Tab,string> = { overview:'Command', orders:'Orders', catalog:'Catalog', inventory:'Inventory', procurement:'Sourcing', customers:'Clients', finance:'Finance', analytics:'Intelligence', audit:'Audit', system:'System' };
type Tab = typeof tabs[number];
const money = (cents?: number) => `$${(Number(cents || 0) / 100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const pct = (value?: number) => `${(Number(value || 0) * 100).toFixed(2)}%`;

export default function OwnerPage() {
  const [token,setToken] = useState('');
  const [readiness,setReadiness] = useState<Readiness | null>(null);
  const [command,setCommand] = useState<CommandCenter | null>(null);
  const [products,setProducts] = useState<Product[]>([]);
  const [candidates,setCandidates] = useState<Candidate[]>([]);
  const [authorized,setAuthorized] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [tab,setTab] = useState<Tab>('overview');
  const [taskTitle,setTaskTitle] = useState('');
  const [taskPriority,setTaskPriority] = useState('medium');
  const [busyAction,setBusyAction] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('sahjony-owner-token') || '';
    queueMicrotask(() => {
      if (saved) { setToken(saved); void loadOwnerData(saved); }
      else void loadReadiness();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  async function loadReadiness(){
    try { const r = await fetch('/api/readiness',{cache:'no-store'}); setReadiness(await r.json()); }
    catch { setReadiness(null); }
  }

  async function loadOwnerData(ownerToken:string){
    setLoading(true); setError(''); await loadReadiness();
    try {
      const headers = {'x-owner-token':ownerToken};
      const [ccRes,catRes,sourceRes] = await Promise.all([
        fetch('/api/owner/command-center',{headers,cache:'no-store'}),
        fetch('/api/owner/catalog',{headers,cache:'no-store'}),
        fetch('/api/owner/sourcing',{headers,cache:'no-store'}),
      ]);
      if (ccRes.status===401 || catRes.status===401 || sourceRes.status===401) {
        sessionStorage.removeItem('sahjony-owner-token'); setAuthorized(false); setCommand(null); setProducts([]); setError('Owner credentials were not accepted.'); return;
      }
      if (!ccRes.ok || !catRes.ok || !sourceRes.ok) { setAuthorized(false); setError('Owner operations are not fully configured in this environment.'); return; }
      const [cc,catalog,sourcing] = await Promise.all([ccRes.json(),catRes.json(),sourceRes.json()]);
      setCommand(cc); setProducts(Array.isArray(catalog.products)?catalog.products:[]); setCandidates(Array.isArray(sourcing.candidates)?sourcing.candidates:[]); setAuthorized(true); sessionStorage.setItem('sahjony-owner-token',ownerToken);
    } catch { setAuthorized(false); setError('Unable to reach owner operations.'); }
    finally { setLoading(false); }
  }

  function submit(event:FormEvent){ event.preventDefault(); if(token.trim()) void loadOwnerData(token.trim()); }
  function signOut(){ sessionStorage.removeItem('sahjony-owner-token'); setToken(''); setCommand(null); setProducts([]); setCandidates([]); setAuthorized(false); setError(''); }

  async function createTask(event:FormEvent){
    event.preventDefault(); if(!taskTitle.trim()) return; setBusyAction('task');
    try {
      const r = await fetch('/api/owner/tasks',{method:'POST',headers:{'content-type':'application/json','x-owner-token':token},body:JSON.stringify({title:taskTitle.trim(),priority:taskPriority})});
      if(!r.ok) throw new Error('task'); setTaskTitle(''); await loadOwnerData(token);
    } catch { setError('Could not create owner task.'); } finally { setBusyAction(''); }
  }

  async function updateTask(id:string,status:string){
    setBusyAction(id);
    try {
      const r = await fetch('/api/owner/tasks',{method:'PATCH',headers:{'content-type':'application/json','x-owner-token':token},body:JSON.stringify({id,status})});
      if(!r.ok) throw new Error('task'); await loadOwnerData(token);
    } catch { setError('Could not update owner task.'); } finally { setBusyAction(''); }
  }

  async function reconcileInventory(){
    setBusyAction('reconcile');
    try {
      const r = await fetch('/api/owner/inventory-reconciliation',{method:'POST',headers:{'x-owner-token':token}});
      if(!r.ok) throw new Error('reconcile'); await loadOwnerData(token);
    } catch { setError('Inventory reconciliation could not complete.'); } finally { setBusyAction(''); }
  }

  async function seedSourcing(){
    setBusyAction('seed-sourcing'); setError('');
    try {
      const r=await fetch('/api/owner/sourcing',{method:'POST',headers:{'content-type':'application/json','x-owner-token':token},body:JSON.stringify({action:'seed_intake'})});
      if(!r.ok) throw new Error('seed'); await loadOwnerData(token);
    } catch { setError('The sourcing intake could not be initialized.'); } finally { setBusyAction(''); }
  }

  async function updateCandidate(id:string,status:string){
    setBusyAction(id); setError('');
    try {
      const r=await fetch('/api/owner/sourcing',{method:'PATCH',headers:{'content-type':'application/json','x-owner-token':token},body:JSON.stringify({id,status})});
      if(!r.ok) throw new Error('candidate'); await loadOwnerData(token);
    } catch { setError('The candidate status could not be updated.'); } finally { setBusyAction(''); }
  }

  const exec = command?.executive || {}; const inv = command?.inventory || {}; const ful = command?.fulfillment || {}; const pro = command?.procurement || {}; const ana = command?.analytics || {}; const fin = command?.finance || {};
  const activeTasks = command?.tasks || [];
  const launchPassed = useMemo(()=>Object.values(readiness?.checks||{}).filter(Boolean).length,[readiness]);
  const launchTotal = Object.keys(readiness?.checks||{}).length;

  if(!authorized){
    return <main className="owner-shell owner-access-shell"><div className="owner-access-art" aria-hidden="true"><span>PRIVATE<br/>COMMERCE<br/>OS</span><i>SAHJONY / OWNER</i></div><div className="owner-login"><Link className="owner-login-mark" href="/">SAHJONY</Link><div className="owner-eyebrow">SECURE OWNER OPERATIONS</div><h1>Your business,<br/><em>in command.</em></h1><p>Enter the private owner token to access revenue, orders, inventory, sourcing, clients and system health.</p><form onSubmit={submit}><label htmlFor="owner-token">OWNER OPERATIONS TOKEN</label><div className="owner-login-control"><input id="owner-token" className="owner-input" type="password" value={token} onChange={e=>setToken(e.target.value)} placeholder="Enter secure token" autoComplete="current-password" required/><button className="owner-primary" disabled={loading}>{loading?'CONNECTING…':'ENTER COMMAND CENTER →'}</button></div></form>{error?<div className="owner-error" role="alert">{error}</div>:null}<div className="owner-access-status"><span className={readiness?.ready?'online':'gated'}>{readiness?.ready?'SYSTEM READY':'SYSTEM GATED'}</span><span>{readiness?.verifiedSellableProducts??0} SELLABLE PRODUCTS</span><span>SESSION-ONLY CREDENTIAL</span></div></div></main>;
  }

  return <main className="owner-shell">
    <header className="owner-top"><div className="owner-brand"><span className="owner-mark">SAHJONY</span><span className="owner-kicker">Owner Commerce OS <i>LIVE</i></span></div><div className="owner-top-actions"><span className="owner-sync">{loading?'SYNCING':'SYNCED'} · {command?.generatedAt?new Date(command.generatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'—'}</span><button className="owner-ghost owner-refresh" onClick={()=>void loadOwnerData(token)} disabled={loading}>↻ Refresh</button><Link className="owner-link" href="/">View store ↗</Link><button className="owner-session" onClick={signOut} aria-label="End owner session">END SESSION</button></div></header>

    <section className="owner-heading"><div><div className="owner-eyebrow">EXECUTIVE COMMAND CENTER / {new Date().toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'}).toUpperCase()}</div><h1>Good to see you.<br/><em>Here&apos;s the business.</em></h1></div><div className="owner-heading-status"><span className={readiness?.ready?'online':'gated'}>{readiness?.ready?'ALL SYSTEMS READY':'LAUNCH GATES ACTIVE'}</span><p>Revenue, clients, inventory, sourcing and fulfillment—one private operating view.</p></div></section>

    <nav className="owner-tabs" aria-label="Owner workspaces" role="tablist">{tabs.map((item,index)=><button key={item} role="tab" aria-selected={tab===item} className={`owner-tab ${tab===item?'active':''}`} onClick={()=>setTab(item)}><span>{String(index+1).padStart(2,'0')}</span>{tabLabels[item]}</button>)}</nav>
    <div className="owner-pulse"><div><span>REVENUE TODAY</span><b>{money(exec.revenueTodayCents)}</b></div><div><span>OPEN ORDERS</span><b>{String(exec.openOrders||0)}</b></div><div><span>SELLABLE SKUS</span><b>{String(inv.sellableProducts||0)}</b></div><div><span>CONVERSION</span><b>{pct(exec.conversionRate)}</b></div><div><span>ACTIONS</span><b>{String(activeTasks.length)}</b></div></div>
    {error?<div className="owner-error" role="alert">{error}</div>:null}
    {loading?<div className="owner-loading" role="status"><span/>REFRESHING LIVE OPERATIONS</div>:null}

    <section className={`owner-module ${tab==='overview'?'active':''}`}>
      <div className="owner-grid">
        <Metric label="Revenue today" value={money(exec.revenueTodayCents)} sub={`7d ${money(exec.revenue7dCents)}`}/>
        <Metric label="Revenue 30d" value={money(exec.revenue30dCents)} sub={`${exec.paidOrders30d||0} paid orders`}/>
        <Metric label="Average order" value={money(exec.averageOrderValueCents)} sub={`${exec.openOrders||0} open orders`}/>
        <Metric label="Conversion" value={pct(exec.conversionRate)} sub={`${ana.sessions30d||0} sessions / 30d`}/>
        <Metric label="Customers" value={String(exec.customers||0)} sub={`${exec.repeatCustomers||0} repeat customers`}/>
        <Metric label="Sellable SKUs" value={String(inv.sellableProducts||0)} sub={`${inv.lowStockProducts||0} low stock`}/>
        <Metric label="Inventory retail" value={money(inv.retailValueCents)} sub={`cost basis ${money(inv.costValueCents)}`}/>
        <Metric label="Procurement" value={money(pro.committedCents)} sub={`${pro.openPurchaseOrders||0} open POs`}/>
      </div>
      <div className="owner-grid">
        <Panel title="Owner Action Queue" meta={`${activeTasks.length} OPEN`} span="6"><TaskList tasks={activeTasks} busyAction={busyAction} updateTask={updateTask}/><form className="owner-task-form" onSubmit={createTask}><input className="owner-input" value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="Add owner action…"/><select className="owner-select" value={taskPriority} onChange={e=>setTaskPriority(e.target.value)}><option>critical</option><option>high</option><option>medium</option><option>low</option></select><button className="owner-primary" disabled={busyAction==='task'}>ADD</button></form></Panel>
        <Panel title="Fulfillment Pulse" meta="CURRENT" span="3"><StatRows rows={[['Unfulfilled',ful.unfulfilled],['Processing',ful.processing],['Shipped',ful.shipped],['Delivered 30d',ful.delivered30d],['Canceled 30d',ful.canceled30d]]}/></Panel>
        <Panel title="Launch Readiness" meta={`${launchPassed}/${launchTotal}`} span="3"><ReadinessGrid readiness={readiness}/></Panel>
        <Panel title="Recent Orders" meta="LATEST 12" span="6"><OrderList orders={command?.recentOrders||[]}/></Panel>
        <Panel title="Top Products" meta="30 DAYS" span="6"><div className="owner-list">{(command?.topProducts||[]).map((p,i)=><div className="owner-row" key={p.product_slug||i}><div><strong>{p.product_name||p.product_slug}</strong><small>{p.units||0} units</small></div><div>{money(p.revenue_cents)}</div></div>)}{!(command?.topProducts||[]).length?<div className="owner-empty">No paid-product performance yet.</div>:null}</div></Panel>
      </div>
    </section>

    <section className={`owner-module ${tab==='orders'?'active':''}`}><div className="owner-grid"><Metric label="Open orders" value={String(exec.openOrders||0)}/><Metric label="Paid 30d" value={String(exec.paidOrders30d||0)}/><Metric label="AOV" value={money(exec.averageOrderValueCents)}/><Metric label="Delivered 30d" value={String(ful.delivered30d||0)}/><Panel title="Order Operations" meta="PAYMENT → FULFILLMENT" span="12"><OrderList orders={command?.recentOrders||[]}/></Panel></div></section>

    <section className={`owner-module ${tab==='catalog'?'active':''}`}><div className="owner-grid"><Metric label="Catalog records" value={String(inv.totalProducts||products.length)}/><Metric label="Active" value={String(inv.activeProducts||0)}/><Metric label="Sellable" value={String(inv.sellableProducts||0)}/><Metric label="Low stock" value={String(inv.lowStockProducts||0)}/><Panel title="Catalog Control" meta="NEON SOURCE OF TRUTH" span="12"><ProductList products={products}/></Panel></div></section>

    <section className={`owner-module ${tab==='inventory'?'active':''}`}><div className="owner-grid"><Metric label="Retail inventory value" value={money(inv.retailValueCents)}/><Metric label="Cost basis" value={money(inv.costValueCents)}/><Metric label="Sellable products" value={String(inv.sellableProducts||0)}/><Metric label="Low stock" value={String(inv.lowStockProducts||0)}/><Panel title="Inventory Control" meta="RECONCILIATION" span="12"><p className="owner-note">Reservations protect stock during checkout. Reconciliation releases expired reservations and keeps inventory aligned with sellable units.</p><div className="owner-actions"><button className="owner-primary" onClick={()=>void reconcileInventory()} disabled={busyAction==='reconcile'}>{busyAction==='reconcile'?'RECONCILING…':'RUN INVENTORY RECONCILIATION'}</button></div><ProductList products={products}/></Panel></div></section>

    <section className={`owner-module ${tab==='procurement'?'active':''}`}><div className="owner-grid"><Metric label="Sourcing candidates" value={String(candidates.length)}/><Metric label="Priority one" value={String(candidates.filter(c=>c.priority===1).length)}/><Metric label="Evidence received" value={String(candidates.filter(c=>c.status==='evidence_received').length)}/><Metric label="Supplier programs" value={String((pro.suppliers||[]).length)}/><Panel title="Catalog Sourcing Pipeline" meta="FAIL-CLOSED" span="8"><div className="sourcing-toolbar"><p className="owner-note">Candidates remain private and unsellable until exact SKU, commercial evidence, inventory, image rights, price and fulfillment terms all pass review. Affiliate-only outlets can support intelligence, never inventory activation.</p><button className="owner-primary" onClick={()=>void seedSourcing()} disabled={busyAction==='seed-sourcing'}>{busyAction==='seed-sourcing'?'INITIALIZING…':candidates.length?'SYNC VETTED INTAKE':'INITIALIZE SOURCING'}</button></div><CandidateList candidates={candidates} busyAction={busyAction} updateCandidate={updateCandidate}/></Panel><Panel title="Supplier Network" meta="PRIVATE" span="4"><div className="owner-list">{(pro.suppliers||[]).map((s:Row)=><div className="owner-row" key={s.id}><div><strong>{s.display_name}</strong><small>{s.code} · {s.source_type||'source type pending'}</small></div><span className="owner-status">{s.status}</span></div>)}{!(pro.suppliers||[]).length?<div className="owner-empty">Initialize sourcing to register the approved prospect programs.</div>:null}</div></Panel></div></section>

    <section className={`owner-module ${tab==='customers'?'active':''}`}><div className="owner-grid"><Metric label="Customers" value={String(exec.customers||0)}/><Metric label="Repeat customers" value={String(exec.repeatCustomers||0)}/><Metric label="Avg customer value" value={money(exec.averageCustomerValueCents)}/><Metric label="Paid orders 30d" value={String(exec.paidOrders30d||0)}/><Panel title="Customer Intelligence" meta="CRM FOUNDATION" span="12"><p className="owner-note">Customer profiles are created from commerce activity and orders. This module will become the Private Client, retention and lifetime-value workspace as transaction history accumulates.</p></Panel></div></section>

    <section className={`owner-module ${tab==='finance'?'active':''}`}><div className="owner-grid"><Metric label="Revenue 30d" value={money(fin.revenue30dCents)}/><Metric label="Inventory cost basis" value={money(fin.inventoryCostBasisCents)}/><Metric label="AOV" value={money(exec.averageOrderValueCents)}/><Metric label="Margin data" value={fin.grossMarginStatus==='cost_data_available'?'AVAILABLE':'AWAITING COSTS'}/><Panel title="Finance Control" meta="UNIT ECONOMICS" span="12"><p className="owner-note">Private product operations store unit cost separately from the public catalog. Once costs are entered, this layer supports gross margin, inventory investment and SKU profitability without exposing sourcing economics publicly.</p></Panel></div></section>

    <section className={`owner-module ${tab==='analytics'?'active':''}`}><div className="owner-grid"><Metric label="Sessions 30d" value={String(ana.sessions30d||0)}/><Metric label="Page views" value={String(ana.pageViews30d||0)}/><Metric label="Product views" value={String(ana.productViews30d||0)}/><Metric label="Conversion" value={pct(ana.conversionRate)}/><Panel title="Commerce Funnel" meta="FIRST-PARTY" span="12"><div className="owner-funnel"><FunnelStep label="Sessions" value={ana.sessions30d}/><FunnelStep label="Page Views" value={ana.pageViews30d}/><FunnelStep label="Product Views" value={ana.productViews30d}/><FunnelStep label="Add to Cart" value={ana.addToCart30d}/><FunnelStep label="Checkout" value={ana.checkoutStarted30d}/></div><p className="owner-note">First-party page telemetry is now captured in Neon. Product/cart/checkout instrumentation can progressively enrich this funnel without relying on third-party analytics for the core owner view.</p></Panel></div></section>

    <section className={`owner-module ${tab==='audit'?'active':''}`}><div className="owner-grid"><Panel title="Owner Audit Trail" meta="LATEST 20" span="12"><div className="owner-list">{(command?.audit||[]).map((a,i)=><div className="owner-row" key={a.id||i}><div><strong>{a.action}</strong><small>{a.entity_type}{a.entity_id?` · ${a.entity_id}`:''}</small></div><small>{a.created_at?new Date(a.created_at).toLocaleString():''}</small></div>)}{!(command?.audit||[]).length?<div className="owner-empty">No owner mutations recorded yet.</div>:null}</div></Panel></div></section>

    <section className={`owner-module ${tab==='system'?'active':''}`}><div className="owner-grid"><Metric label="Platform" value={readiness?.ready?'READY':'GATED'}/><Metric label="Readiness gates" value={`${launchPassed}/${launchTotal}`}/><Metric label="Sellable inventory" value={String(readiness?.verifiedSellableProducts||0)}/><Metric label="Data generated" value={command?.generatedAt?new Date(command.generatedAt).toLocaleTimeString():'—'}/><Panel title="System Health & Launch Gates" meta="FAIL-CLOSED" span="12"><ReadinessGrid readiness={readiness}/></Panel></div></section>
  </main>;
}

function Metric({label,value,sub}:{label:string,value:string,sub?:string}){return <div className="owner-card span-3"><div className="metric-label">{label}</div><div className="metric-value">{value}</div>{sub?<div className="metric-sub">{sub}</div>:null}</div>}
function Panel({title,meta,span,children}:{title:string,meta:string,span:string,children:React.ReactNode}){return <div className={`owner-card span-${span}`}><div className="owner-section-title"><h2>{title}</h2><span>{meta}</span></div>{children}</div>}
function StatRows({rows}:{rows:Array<[string,any]>}){return <div className="owner-list">{rows.map(([label,value])=><div className="owner-row" key={label}><strong>{label}</strong><span>{String(value||0)}</span></div>)}</div>}
function FunnelStep({label,value}:{label:string,value:any}){return <div className="owner-funnel-step"><b>{String(value||0)}</b><span>{label}</span></div>}
function ReadinessGrid({readiness}:{readiness:Readiness|null}){return <div className="owner-readiness">{Object.entries(readiness?.checks||{}).map(([key,value])=><div key={key}><span>{key}</span><b className={value?'pass':'gated'}>{value?'PASS':'GATED'}</b></div>)}</div>}
function OrderList({orders}:{orders:Row[]}){return <div className="owner-list">{orders.map((o,i)=><div className="owner-row" key={o.id||i}><div><strong>{o.order_number||'ORDER'} · {o.email||'customer'}</strong><small>{o.payment_status||'unpaid'} · {o.fulfillment_status||'unfulfilled'}{o.tracking_number?` · ${o.tracking_carrier||''} ${o.tracking_number}`:''}</small></div><div>{money(o.total_cents)}</div></div>)}{!orders.length?<div className="owner-empty">No orders yet.</div>:null}</div>}
function ProductList({products}:{products:Product[]}){return <div className="owner-list">{products.slice(0,50).map((p,i)=><div className="owner-row" key={p.slug||p.sku||i}><div><strong>{p.brand} {p.name}</strong><small>{p.sku||'NO SKU'} · stock {Number(p.inventory_quantity||0)} · {money(p.price_cents)}</small></div><span className="owner-status">{p.is_active&&p.source_verified?'LIVE':'HOLD'}</span></div>)}{!products.length?<div className="owner-empty">No internal catalog records yet.</div>:null}</div>}
function TaskList({tasks,busyAction,updateTask}:{tasks:Row[],busyAction:string,updateTask:(id:string,status:string)=>Promise<void>}){return <div className="owner-list">{tasks.slice(0,10).map((t,i)=><div className="owner-row" key={t.id||i}><div><strong>{t.title}</strong><small>{t.category} · {t.priority} · {t.status}</small></div><button className="owner-ghost" disabled={busyAction===t.id} onClick={()=>void updateTask(String(t.id),'done')}>DONE</button></div>)}{!tasks.length?<div className="owner-empty">No owner actions waiting.</div>:null}</div>}
function CandidateList({candidates,busyAction,updateCandidate}:{candidates:Candidate[],busyAction:string,updateCandidate:(id:string,status:string)=>Promise<void>}){return <div className="owner-list sourcing-list">{candidates.map((c)=>{const intelligenceOnly=c.supplier_source_type==='market_intelligence_affiliate_only';return <div className="owner-row sourcing-row" key={c.candidate_code}><div><div className="candidate-meta"><span>P{c.priority}</span><span>{c.category}</span><span>{c.supplier_name}</span>{c.supplier_source_type?<span>{String(c.supplier_source_type).replaceAll('_',' ')}</span>:null}</div><strong>{c.brand} · {c.proposed_name}</strong><small>{c.candidate_code} · SKU {c.manufacturer_sku||'PENDING'} · {String(c.evidence_status||'').replaceAll('_',' ')}</small></div><div className="candidate-actions"><span className={`owner-status status-${c.status}`}>{c.status}</span>{c.status==='hold'?<button className="owner-ghost" disabled={busyAction===c.id} onClick={()=>void updateCandidate(String(c.id),'evidence_requested')}>{intelligenceOnly?'REVIEW TERMS':'REQUEST EVIDENCE'}</button>:null}</div></div>})}{!candidates.length?<div className="owner-empty">No candidates initialized. Seed the vetted HOLD intake to begin supplier review.</div>:null}</div>}
