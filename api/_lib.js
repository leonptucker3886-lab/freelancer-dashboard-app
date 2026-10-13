const SUPA='https://cjtutkvhyzjsgclqvylg.supabase.co',ANON='sb_publishable_E48ovT9wWxduLxnzPXL_5g_SnNl2rqz';
const SITE='https://dashapp.leonlink.net',FROM='Dashline <invoices@leonlink.net>';
const PRICES={pro:{amount:900,name:'Dashline Pro'},business:{amount:1900,name:'Dashline Business'}};
const ZERO=['JPY','KRW','VND','CLP','ISK','UGX','XAF','XOF'];
function form(o,p,out=[]){for(const k in o){const v=o[k],key=p?`${p}[${k}]`:k;if(v==null)continue;if(typeof v==='object')form(v,key,out);else out.push(encodeURIComponent(key)+'='+encodeURIComponent(v))}return out.join('&')}
async function stripe(path,params){const r=await fetch('https://api.stripe.com/v1/'+path,{method:params?'POST':'GET',headers:{Authorization:'Bearer '+process.env.STRIPE_SECRET_KEY,'Content-Type':'application/x-www-form-urlencoded'},body:params?form(params):undefined});const j=await r.json();if(!r.ok)throw new Error(j.error?.message||'Stripe error');return j}
async function rest(path,{token,method='GET',body}={}){const r=await fetch(SUPA+'/rest/v1/'+path,{method,headers:{apikey:ANON,Authorization:'Bearer '+(token||ANON),'Content-Type':'application/json',Prefer:'return=representation'},body:body?JSON.stringify(body):undefined});const t=await r.text();const j=t?JSON.parse(t):null;if(!r.ok)throw new Error(j?.message||'Database error');return j}
const rpc=(fn,args,token)=>rest('rpc/'+fn,{method:'POST',body:args,token});
const srv=(fn,args)=>rpc(fn,{sec:process.env.DASHLINE_SERVER_SECRET,...args});
async function user(req){const t=(req.headers.authorization||'').replace(/^Bearer /,'');const bad=()=>Object.assign(new Error('Not signed in'),{code:401});if(!t)throw bad();const r=await fetch(SUPA+'/auth/v1/user',{headers:{apikey:ANON,Authorization:'Bearer '+t}});if(!r.ok)throw bad();const u=await r.json();const pl=await rest('fd_plans?select=plan&user_id=eq.'+u.id,{token:t});u.plan=pl[0]?.plan||'free';u.token=t;return u}
async function priceId(tier){const key='dashline_'+tier+'_monthly';const l=await stripe('prices?active=true&lookup_keys[]='+key);if(l.data[0])return l.data[0].id;const p=PRICES[tier];const pr=await stripe('products',{name:p.name});const x=await stripe('prices',{product:pr.id,unit_amount:p.amount,currency:'usd',recurring:{interval:'month'},lookup_key:key});return x.id}
async function sendMail({to,subject,html,reply_to}){const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:FROM,to:[to],subject,html,reply_to:reply_to||undefined})});const j=await r.json();if(!r.ok)throw new Error(j.message||'Email failed');return j}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const money=(n,c)=>{try{return new Intl.NumberFormat('en-US',{style:'currency',currency:c||'USD'}).format(+n||0)}catch{return(+n||0).toFixed(2)}};
const minor=(n,c)=>Math.round((+n||0)*(ZERO.includes(String(c).toUpperCase())?1:100));
const tierOk=(u,t)=>t==='pro'?['pro','business'].includes(u.plan):u.plan==='business';
const mailWrap=(biz,inner)=>`<div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181B">${biz.logo?`<img src="${esc(biz.logo)}" style="max-height:48px;margin-bottom:12px">`:''}<h2 style="margin:0 0 16px">${esc(biz.name||'Invoice')}</h2>${inner}<p style="color:#71717A;font-size:12px;margin-top:32px">Sent with Dashline</p></div>`;
const btn=(href,l)=>`<p><a href="${href}" style="display:inline-block;background:#2A78D6;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">${l}</a></p>`;
const page=msg=>`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><p style="font-family:system-ui;padding:40px">${esc(msg)}</p>`;
const payUrl=(token,id)=>`${SITE}/api/pay?t=${token}&i=${id}`;
function handler(fn){return async(req,res)=>{try{if(typeof req.body==='string'&&req.body)req.body=JSON.parse(req.body);await fn(req,res)}catch(e){res.status(e.code||400).json({error:e.message})}}}
module.exports={SITE,stripe,rest,rpc,srv,user,priceId,sendMail,esc,money,minor,tierOk,mailWrap,btn,page,payUrl,handler};
