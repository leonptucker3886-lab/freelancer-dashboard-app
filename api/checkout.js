const L=require('./_lib');
// Start (or switch) a Pro/Business subscription for the signed-in user.
module.exports=L.handler(async(req,res)=>{const u=await L.user(req),tier=req.body?.tier;if(!['pro','business'].includes(tier))throw new Error('Pick a plan');
 const price=await L.priceId(tier);
 const subs=await L.stripe(`subscriptions/search?query=${encodeURIComponent(`metadata['uid']:'${u.id}' AND status:'active'`)}`);
 if(subs.data[0]){const s=subs.data[0];await L.stripe('subscriptions/'+s.id,{items:{0:{id:s.items.data[0].id,price}},metadata:{uid:u.id,tier},proration_behavior:'create_prorations'});await L.srv('fd_srv_set_plan',{uid:u.id,p:tier});return res.json({changed:tier})}
 const s=await L.stripe('checkout/sessions',{mode:'subscription',line_items:{0:{price,quantity:1}},customer_email:u.email,client_reference_id:u.id,subscription_data:{metadata:{uid:u.id,tier}},metadata:{uid:u.id,tier},allow_promotion_codes:'true',success_url:L.SITE+'/?checkout=success',cancel_url:L.SITE+'/?checkout=cancel'});
 res.json({url:s.url})});
