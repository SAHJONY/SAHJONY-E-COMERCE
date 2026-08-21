import { createHmac,timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { departmentAddresses } from '@/lib/email-channels';
import { resendRequest } from '@/lib/resend-api';
import { ensureCommunicationsSchema } from '@/lib/communications-schema';
import { getSql } from '@/lib/db';
import { writeOwnerAudit } from '@/lib/owner-audit';

function authorized(request:Request){const configured=process.env.OWNER_OPERATIONS_TOKEN;const supplied=request.headers.get('x-owner-token');if(!configured||!supplied)return false;const a=Buffer.from(configured);const b=Buffer.from(supplied);return a.length===b.length&&timingSafeEqual(a,b)}

async function domainDetails(){
  const list=await resendRequest('/domains');
  const domain=list.data?.find((item:{name?:string})=>item.name==='sahjony.com');
  return domain?resendRequest(`/domains/${domain.id}`):null;
}

export async function GET(request:Request){
  if(!authorized(request))return NextResponse.json({error:'unauthorized'},{status:401});
  try{
    const domain=await domainDetails();
    await ensureCommunicationsSchema();
    const sql=getSql();
    const messages=await sql`select id,provider_id,direction,department,from_address,to_addresses,subject,status,created_at
      from public.communication_messages order by created_at desc limit 30`;
    return NextResponse.json({configured:Boolean(process.env.RESEND_API_KEY),domain,departments:departmentAddresses,messages});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'communications_unavailable',departments:departmentAddresses},{status:503})}
}

export async function POST(request:Request){
  if(!authorized(request))return NextResponse.json({error:'unauthorized'},{status:401});
  const body=await request.json();
  if(body?.action!=='initialize_email_domain'&&body?.action!=='verify_email_domain')return NextResponse.json({error:'unsupported_action'},{status:400});
  let domain=await domainDetails();
  if(!domain){
    domain=await resendRequest('/domains',{method:'POST',body:JSON.stringify({name:'sahjony.com',region:'us-east-1',tls:'enforced',capabilities:{sending:'enabled',receiving:'enabled'}})});
  }
  const appUrl=(process.env.NEXT_PUBLIC_APP_URL||'https://www.sahjony.com').replace(/\/$/,'');
  const webhookToken=createHmac('sha256',process.env.OWNER_OPERATIONS_TOKEN||'').update('resend-inbound-v1').digest('hex');
  const webhookEndpoint=`${appUrl}/api/webhooks/resend?token=${webhookToken}`;
  const hooks=await resendRequest('/webhooks');
  if(!hooks.data?.some((hook:{endpoint?:string})=>hook.endpoint===webhookEndpoint)){
    await resendRequest('/webhooks',{method:'POST',body:JSON.stringify({endpoint:webhookEndpoint,events:['email.received','email.delivered','email.bounced','email.complained','email.failed']})});
  }
  if(body.action==='verify_email_domain')await resendRequest(`/domains/${domain.id}/verify`,{method:'POST'});
  domain=await resendRequest(`/domains/${domain.id}`);
  await writeOwnerAudit({action:`communications.${body.action}`,entityType:'email_domain',entityId:domain.id,metadata:{status:domain.status,capabilities:domain.capabilities}});
  return NextResponse.json({domain,departments:departmentAddresses});
}
