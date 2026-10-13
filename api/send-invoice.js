const L=require('./_lib');
// Email an invoice (Pro+) or an overdue reminder (Business) to the client.
module.exports=L.handler(async(req,res)=>{const u=await L.user(req),{invoice_id,reminder}=req.body||{};
 if(!L.tierOk(u,reminder?'business':'pro'))throw new Error(reminder?'Reminders are a Business feature.':'Emailing invoices is a Pro feature.');
 const[i]=await L.rest(`fd_invoices?select=*,fd_clients(name,email,portal_token)&id=eq.${invoice_id}`,{token:u.token});if(!i)throw new Error('Invoice not found');
 const c=i.fd_clients;if(!c?.email)throw new Error('Add an email address to this client first.');
 const[st]=await L.rest('fd_settings?select=prefs',{token:u.token});const pr=st?.prefs||{},biz=pr.biz||{},cur=pr.currency||'USD';
 const total=await L.rpc('fd_inv_total_by_id',{inv:i.id},u.token).catch(()=>null);
 const items=(i.items||[]).length?i.items:[{desc:'Services',qty:1,price:i.amount}];
 const sub=items.reduce((s,x)=>s+(+x.qty||0)*(+x.price||0),0),tot=total??sub*(1+(+i.tax_rate||0)/100);
 const rows=items.map(x=>`<tr><td style="padding:6px 0">${L.esc(x.desc)}</td><td align="right">${L.esc(x.qty)}</td><td align="right">${L.money(x.price,cur)}</td></tr>`).join('');
 const inner=`<p>Hi ${L.esc(c.name)},</p><p>${reminder?`This is a friendly reminder that invoice <b>${L.esc(i.number)}</b> was due on <b>${L.esc(i.due_date)}</b> and is still unpaid.`:`Here is invoice <b>${L.esc(i.number)}</b>${i.due_date?`, due <b>${L.esc(i.due_date)}</b>`:''}.`}</p>
<table width="100%" style="border-collapse:collapse;font-size:14px;border-top:1px solid #DEDDD8">${rows}${+i.tax_rate?`<tr><td colspan="2" align="right" style="padding-top:8px">Tax ${L.esc(i.tax_rate)}%</td><td align="right" style="padding-top:8px">${L.money(sub*(+i.tax_rate)/100,cur)}</td></tr>`:''}<tr><td colspan="2" align="right" style="padding-top:8px"><b>Total</b></td><td align="right" style="padding-top:8px"><b>${L.money(tot,cur)}</b></td></tr></table>
${L.btn(L.payUrl(c.portal_token,i.id),'Pay '+L.money(tot,cur)+' online')}${u.plan==='business'?`<p style="font-size:13px"><a href="${L.SITE}/portal.html?t=${c.portal_token}">View all your invoices and documents</a></p>`:''}${biz.address?`<p style="color:#71717A;font-size:12px;white-space:pre-line">${L.esc(biz.address)}</p>`:''}`;
 await L.sendMail({to:c.email,reply_to:biz.email||u.email,subject:`${reminder?'Reminder: ':''}Invoice ${i.number||''} from ${biz.name||'your freelancer'}`,html:L.mailWrap(biz,inner)});
 await L.rest('fd_invoices?id=eq.'+i.id,{token:u.token,method:'PATCH',body:reminder?{reminded_at:new Date().toISOString()}:{sent_at:new Date().toISOString()}});
 res.json({ok:true,to:c.email})});
