import { NextResponse } from "next/server";
import { products, evaluate } from "@/lib/commerce";

export async function POST(request: Request){
  const body = await request.json().catch(()=>({}));
  const product = products.find(p=>p.slug===body.slug);
  if(!product) return NextResponse.json({ok:false,message:"Product not found."},{status:404});
  const decision=evaluate(product);
  return NextResponse.json({ok:decision.status==="approved",mode:"FAIL_CLOSED_DEMO",operatingModel:"CUSTOMER_PAYS_SAHJONY_THEN_SAHJONY_BUYS_RECEIVES_INSPECTS_AND_SHIPS",decision,message:decision.status==="approved"?"Procurement gates pass. Live supplier purchase remains disabled until integrations are verified.":decision.reason});
}
