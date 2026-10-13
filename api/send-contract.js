const L=require('./_lib');
// Email a contract signing link to the client (Business).
module.exports=L.handler(async(req,res)=>{const u=await L.user(req);if(!L.tierOk(u,'business'))throw new Error('Contracts are a Business feature.');
 const[k]=await L.rest(`fd_contracts?select=*,fd_clients(name,email)&id=eq.${req.body?.contract_id}`,{token:u.token});if(!k)throw new Error('Contract not found');
 if(!k.fd_clients?.email)throw new Error('Pick a client with an email address first.');
 if(k.status==='Signed')throw new Error('This contract is already signed.');
 const[st]=await L.rest('fd_settings?select=prefs',{token:u.token});const biz=st?.prefs?.biz||{};
 if(k.status==='Draft')await L.rest('fd_contracts?id=eq.'+k.id,{token:u.token,method:'PATCH',body:{status:'Sent',sent_at:new Date().toISOString()}});
 await L.sendMail({to:k.fd_clients.email,reply_to:biz.email||u.email,subject:`Please review and sign: ${k.title}`,html:L.mailWrap(biz,`<p>Hi ${L.esc(k.fd_clients.name)},</p><p>${L.esc(biz.name||'I')} sent you <b>${L.esc(k.title)}</b> to review and sign online.</p>${L.btn(`${L.SITE}/sign.html?t=${k.token}`,'Review and sign')}`)});
 res.json({ok:true,to:k.fd_clients.email})});
