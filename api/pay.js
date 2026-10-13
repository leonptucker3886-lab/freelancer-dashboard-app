const L=require('./_lib');
// Public pay link: /api/pay?t=<client portal token>&i=<invoice id>. Creates a fresh Stripe Checkout each time.
module.exports=async(req,res)=>{try{const{t,i}=req.query;const p=await L.rpc('fd_pay_info',{t,inv:i});if(!p)throw new Error('Invoice not found.');
 if(p.status==='Paid')return res.redirect(303,`${L.SITE}/portal.html?t=${t}&paid=1`);
 if(!['pro','business'].includes(p.plan))throw new Error('Online payment is not enabled for this invoice.');
 if(!(p.total>0))throw new Error('This invoice has no amount due.');
 const s=await L.stripe('checkout/sessions',{mode:'payment',customer_email:p.email||undefined,line_items:{0:{quantity:1,price_data:{currency:String(p.currency).toLowerCase(),unit_amount:L.minor(p.total,p.currency),product_data:{name:`Invoice ${p.number||''}${p.biz?' - '+p.biz:''}`}}}},metadata:{invoice:i,token:t},success_url:`${L.SITE}/api/paid?s={CHECKOUT_SESSION_ID}`,cancel_url:`${L.SITE}/portal.html?t=${t}`});
 res.redirect(303,s.url)}catch(e){res.status(400).send(L.page(e.message))}};
