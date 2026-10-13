const L=require('./_lib');
// Reconcile the signed-in user's plan with Stripe and mark invoices paid through Stripe.
module.exports=L.handler(async(req,res)=>{const u=await L.user(req);let plan=u.plan;
 const all=await L.stripe(`subscriptions/search?query=${encodeURIComponent(`metadata['uid']:'${u.id}'`)}&limit=20`);
 if(all.data.length){const act=all.data.filter(s=>['active','trialing','past_due'].includes(s.status));const t=act.some(s=>s.metadata.tier==='business')?'business':act.length?'pro':'free';
  if(t!==plan){await L.srv('fd_srv_set_plan',{uid:u.id,p:t});const r=await L.rest('fd_plans?select=plan&user_id=eq.'+u.id,{token:u.token});plan=r[0]?.plan||t}}
 const open=await L.rest('fd_invoices?select=id&status=neq.Paid',{token:u.token});const ids=new Set(open.map(x=>x.id));let paid=0;
 if(ids.size){const sess=await L.stripe('checkout/sessions?limit=100&status=complete');for(const s of sess.data)if(ids.has(s.metadata?.invoice)&&s.payment_status==='paid'){await L.srv('fd_srv_mark_paid',{inv:s.metadata.invoice});paid++}}
 res.json({plan,paid})});
