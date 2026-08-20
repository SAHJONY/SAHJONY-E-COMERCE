import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { ensureOperationsSchema } from '@/lib/operations-schema';
import { ensureOwnerAuditSchema } from '@/lib/owner-audit';

function authorized(request: Request) {
  const configured = process.env.OWNER_OPERATIONS_TOKEN;
  const supplied = request.headers.get('x-owner-token');
  if (!configured || !supplied) return false;
  const a = Buffer.from(configured);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Row = Record<string, unknown>;
const rows = (value: unknown) => (Array.isArray(value) ? value as Row[] : []);
const first = (value: unknown) => rows(value)[0] ?? {};
const num = (value: unknown) => Number(value ?? 0);

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'database_not_ready' }, { status: 503 });

  await Promise.all([ensureOperationsSchema(), ensureOwnerAuditSchema()]);
  const sql = getSql();

  const [
    revenue,
    orderStats,
    customerStats,
    inventoryStats,
    fulfillmentStats,
    procurementStats,
    analyticsStats,
    recentOrders,
    topProducts,
    recentTasks,
    recentAudit,
    suppliers,
  ] = await Promise.all([
    sql`select
      coalesce(sum(total_cents) filter (where payment_status = 'paid' and created_at >= date_trunc('day', now())), 0)::bigint as today_cents,
      coalesce(sum(total_cents) filter (where payment_status = 'paid' and created_at >= now() - interval '7 days'), 0)::bigint as seven_day_cents,
      coalesce(sum(total_cents) filter (where payment_status = 'paid' and created_at >= now() - interval '30 days'), 0)::bigint as thirty_day_cents
    from public.orders`,
    sql`select
      count(*) filter (where created_at >= now() - interval '30 days')::int as orders_30d,
      count(*) filter (where payment_status = 'paid' and created_at >= now() - interval '30 days')::int as paid_orders_30d,
      coalesce(avg(total_cents) filter (where payment_status = 'paid' and created_at >= now() - interval '30 days'), 0)::bigint as aov_cents,
      count(*) filter (where fulfillment_status not in ('delivered','canceled'))::int as open_orders
    from public.orders`,
    sql`with customer_orders as (
      select email, count(*) filter (where payment_status = 'paid') as paid_orders,
             coalesce(sum(total_cents) filter (where payment_status = 'paid'),0) as lifetime_value
      from public.orders group by email
    )
    select
      (select count(*)::int from public.customers) as customers,
      count(*) filter (where paid_orders > 1)::int as repeat_customers,
      coalesce(avg(lifetime_value) filter (where paid_orders > 0),0)::bigint as avg_customer_value_cents
    from customer_orders`,
    sql`select
      count(*)::int as total_products,
      count(*) filter (where p.is_active)::int as active_products,
      count(*) filter (where p.is_active and p.source_verified and p.inventory_quantity > 0)::int as sellable_products,
      count(*) filter (where p.inventory_quantity <= coalesce(po.reorder_point,0) and p.is_active)::int as low_stock_products,
      coalesce(sum(p.inventory_quantity * p.price_cents),0)::bigint as retail_inventory_value_cents,
      coalesce(sum(p.inventory_quantity * coalesce(po.unit_cost_cents,0)),0)::bigint as cost_inventory_value_cents
    from public.products p
    left join public.product_operations po on po.product_id = p.id`,
    sql`select
      count(*) filter (where fulfillment_status = 'unfulfilled')::int as unfulfilled,
      count(*) filter (where fulfillment_status = 'processing')::int as processing,
      count(*) filter (where fulfillment_status = 'shipped')::int as shipped,
      count(*) filter (where fulfillment_status = 'delivered' and delivered_at >= now() - interval '30 days')::int as delivered_30d,
      count(*) filter (where fulfillment_status = 'canceled' and created_at >= now() - interval '30 days')::int as canceled_30d
    from public.orders`,
    sql`select
      count(*) filter (where status in ('draft','approved','submitted','in_transit'))::int as open_purchase_orders,
      coalesce(sum(total_cents) filter (where status in ('approved','submitted','in_transit')),0)::bigint as committed_cents,
      count(*) filter (where expected_at is not null and expected_at < now() and status not in ('received','canceled'))::int as overdue_purchase_orders
    from public.purchase_orders`,
    sql`select
      count(distinct session_key) filter (where created_at >= now() - interval '30 days')::int as sessions_30d,
      count(*) filter (where event_name = 'page_view' and created_at >= now() - interval '30 days')::int as page_views_30d,
      count(*) filter (where event_name = 'product_view' and created_at >= now() - interval '30 days')::int as product_views_30d,
      count(*) filter (where event_name = 'add_to_cart' and created_at >= now() - interval '30 days')::int as add_to_cart_30d,
      count(*) filter (where event_name = 'checkout_started' and created_at >= now() - interval '30 days')::int as checkout_started_30d
    from public.commerce_events`,
    sql`select id, order_number, email, payment_status, fulfillment_status, total_cents, currency, tracking_carrier, tracking_number, created_at
        from public.orders order by created_at desc limit 12`,
    sql`select oi.product_slug, max(oi.product_name) as product_name,
               sum(oi.quantity)::int as units,
               sum(oi.unit_price_cents * oi.quantity)::bigint as revenue_cents
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        where o.payment_status = 'paid' and o.created_at >= now() - interval '30 days'
        group by oi.product_slug order by revenue_cents desc limit 8`,
    sql`select id, title, category, priority, status, due_at, entity_type, entity_id, notes, created_at, updated_at
        from public.owner_tasks where status not in ('done','canceled')
        order by case priority when 'critical' then 1 when 'high' then 2 when 'medium' then 3 else 4 end, created_at asc
        limit 20`,
    sql`select id, action, entity_type, entity_id, metadata, created_at
        from public.owner_audit_log order by created_at desc limit 20`,
    sql`select id, code, display_name, status, source_type, updated_at
        from public.supplier_accounts order by updated_at desc limit 20`,
  ]);

  const rev = first(revenue);
  const ord = first(orderStats);
  const cus = first(customerStats);
  const inv = first(inventoryStats);
  const ful = first(fulfillmentStats);
  const pro = first(procurementStats);
  const ana = first(analyticsStats);

  const paidOrders = num(ord.paid_orders_30d);
  const sessions = num(ana.sessions_30d);
  const conversionRate = sessions > 0 ? paidOrders / sessions : 0;
  const revenue30 = num(rev.thirty_day_cents);
  const estimatedCogs = num(inv.cost_inventory_value_cents);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    executive: {
      revenueTodayCents: num(rev.today_cents),
      revenue7dCents: num(rev.seven_day_cents),
      revenue30dCents: revenue30,
      orders30d: num(ord.orders_30d),
      paidOrders30d: paidOrders,
      averageOrderValueCents: num(ord.aov_cents),
      openOrders: num(ord.open_orders),
      customers: num(cus.customers),
      repeatCustomers: num(cus.repeat_customers),
      averageCustomerValueCents: num(cus.avg_customer_value_cents),
      conversionRate,
    },
    inventory: {
      totalProducts: num(inv.total_products),
      activeProducts: num(inv.active_products),
      sellableProducts: num(inv.sellable_products),
      lowStockProducts: num(inv.low_stock_products),
      retailValueCents: num(inv.retail_inventory_value_cents),
      costValueCents: estimatedCogs,
    },
    fulfillment: {
      unfulfilled: num(ful.unfulfilled),
      processing: num(ful.processing),
      shipped: num(ful.shipped),
      delivered30d: num(ful.delivered_30d),
      canceled30d: num(ful.canceled_30d),
    },
    procurement: {
      openPurchaseOrders: num(pro.open_purchase_orders),
      committedCents: num(pro.committed_cents),
      overduePurchaseOrders: num(pro.overdue_purchase_orders),
      suppliers: rows(suppliers),
    },
    analytics: {
      sessions30d: sessions,
      pageViews30d: num(ana.page_views_30d),
      productViews30d: num(ana.product_views_30d),
      addToCart30d: num(ana.add_to_cart_30d),
      checkoutStarted30d: num(ana.checkout_started_30d),
      conversionRate,
    },
    finance: {
      revenue30dCents: revenue30,
      inventoryCostBasisCents: estimatedCogs,
      grossMarginStatus: estimatedCogs > 0 ? 'cost_data_available' : 'awaiting_unit_costs',
    },
    recentOrders: rows(recentOrders),
    topProducts: rows(topProducts),
    tasks: rows(recentTasks),
    audit: rows(recentAudit),
  });
}
