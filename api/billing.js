const L=require('./_lib');
// Stripe customer portal: cancel or update card.
module.exports=L.handler(async(req,res)=>{const u=await L.user(req);const subs=await L.stripe(`subscriptions/search?query=${encodeURIComponent(`metadata['uid']:'${u.id}'`)}`);
 if(!subs.data[0])throw new Error('No paid subscription on this account');const s=await L.stripe('billing_portal/sessions',{customer:subs.data[0].customer,return_url:L.SITE+'/'});res.json({url:s.url})});
