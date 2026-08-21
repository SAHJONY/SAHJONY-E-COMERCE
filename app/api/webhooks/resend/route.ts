import { createHmac,timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { departmentFromRecipients } from '@/lib/email-channels';
import { ensureCommunicationsSchema } from '@/lib/communications-schema';
import { getSql } from '@/lib/db';

function expectedToken(){const owner=process.env.OWNER_OPERATIONS_TOKEN||'';return createHmac('sha256',owner).update('resend-inbound-v1').digest('hex')}

export async function POST(request:Request){
  const supplied=new URL(request.url).searchParams.get('token')||'';const expected=expectedToken();
  const a=Buffer.from(supplied);const b=Buffer.from(expected);
  if(!expected||a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({error:'unauthorized'},{status:401});
  const event=await request.json();
  const data=event?.data||{};const recipients=Array.isArray(data.to)?data.to:[];
  await ensureCommunicationsSchema();const sql=getSql();
  await sql`insert into public.communication_messages
    (provider_id,direction,department,from_address,to_addresses,subject,status,metadata,updated_at)
    values (${String(data.email_id||event.id||crypto.randomUUID())},${event.type==='email.received'?'inbound':'outbound'},
      ${departmentFromRecipients(recipients)},${String(data.from||'')},${JSON.stringify(recipients)}::jsonb,
      ${String(data.subject||'')},${String(event.type||'received')},${JSON.stringify({createdAt:event.created_at||null})}::jsonb,now())
    on conflict (provider_id) do update set status=excluded.status,metadata=excluded.metadata,updated_at=now()`;
  return NextResponse.json({received:true});
}
