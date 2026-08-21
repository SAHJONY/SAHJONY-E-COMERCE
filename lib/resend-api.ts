const baseUrl = 'https://api.resend.com';

export async function resendRequest(path:string,init:RequestInit={}) {
  const apiKey=process.env.RESEND_API_KEY;
  if(!apiKey) throw new Error('RESEND_API_KEY is not configured');
  const response=await fetch(`${baseUrl}${path}`,{
    ...init,
    headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json','user-agent':'sahjony-commerce/1.0',...(init.headers||{})},
  });
  const body=await response.json();
  if(!response.ok) throw new Error(`Resend ${response.status}: ${body.message||body.name||'request failed'}`);
  return body;
}
