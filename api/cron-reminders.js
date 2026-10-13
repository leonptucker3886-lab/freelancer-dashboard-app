const L=require('./_lib');
// Daily (Vercel Cron): email overdue reminders for Business accounts, at most once every 7 days per invoice.
module.exports=async(req,res)=>{try{const list=await L.srv('fd_srv_overdue',{});let sent=0;
 for(const i of list){try{const biz=i.biz||{};
  await L.sendMail({to:i.email,reply_to:biz.email||undefined,subject:`Reminder: Invoice ${i.number||''} is overdue`,html:L.mailWrap(biz,`<p>Hi ${L.esc(i.client)},</p><p>This is a friendly reminder that invoice <b>${L.esc(i.number)}</b> for <b>${L.money(i.total,i.currency)}</b> was due on <b>${L.esc(i.due_date)}</b> and is still unpaid.</p>${L.btn(L.payUrl(i.token,i.id),'Pay online')}<p style="font-size:13px"><a href="${L.SITE}/portal.html?t=${i.token}">View your invoices</a></p>`)});
  await L.srv('fd_srv_reminded',{inv:i.id});sent++}catch(e){console.error(i.id,e.message)}}
 res.json({checked:list.length,sent})}catch(e){res.status(500).json({error:e.message})}};
