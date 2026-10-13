const L=require('./_lib');
module.exports=async(req,res)=>{try{const s=await L.stripe('checkout/sessions/'+encodeURIComponent(req.query.s||''));
 if(s.payment_status==='paid'&&s.metadata?.invoice)await L.srv('fd_srv_mark_paid',{inv:s.metadata.invoice});
 res.redirect(303,`${L.SITE}/portal.html?t=${s.metadata?.token||''}&paid=1`)}catch(e){res.status(400).send(L.page(e.message))}};
