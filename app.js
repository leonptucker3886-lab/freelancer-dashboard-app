const sb=supabase.createClient('https://cjtutkvhyzjsgclqvylg.supabase.co','sb_publishable_E48ovT9wWxduLxnzPXL_5g_SnNl2rqz');
const $=i=>document.getElementById(i),esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),today=()=>new Date().toISOString().slice(0,10);
const DEF={currency:'USD',dateFmt:'YYYY-MM-DD',tax:0,theme:'light',accent:'#2A78D6',biz:{name:'',email:'',address:'',logo:''},
 cards:[{k:'active',on:true},{k:'pipeline',on:true},{k:'paid',on:true},{k:'outstanding',on:true},{k:'overdue',on:true},{k:'ytd',on:false},{k:'hours',on:false},{k:'unbilled',on:false}],
 widgets:{chart:true,overdueList:true},
 statuses:{clients:['Active','Lead','Inactive'],projects:['Proposal','In progress','Done']},
 fields:{clients:[],projects:[],invoices:[]},prefix:'INV-'};
const CARDS={active:'Active clients',pipeline:'Pipeline value',paid:'Paid (all time)',outstanding:'Outstanding',overdue:'Overdue invoices',ytd:'Income this year',hours:'Hours this month',unbilled:'Unbilled time'};
const LIMITS={clients:3,projects:5,invoices:10};
let mode='login',view='home',D={clients:[],projects:[],invoices:[],time:[]},S=structuredClone(DEF),plan='free',uid=null,Q={};
const deep=(a,b)=>{for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k]))a[k]=deep(a[k]||{},b[k]);else a[k]=b[k]}return a};
const money=n=>{try{return new Intl.NumberFormat(undefined,{style:'currency',currency:S.currency,maximumFractionDigits:2}).format(Number(n||0))}catch{return Number(n||0).toFixed(2)}};
const fdate=d=>{if(!d)return'';const[y,m,dd]=d.split('-');return S.dateFmt==='DD/MM/YYYY'?`${dd}/${m}/${y}`:S.dateFmt==='MM/DD/YYYY'?`${m}/${dd}/${y}`:d};
const toast=m=>{const t=$('toast');t.textContent=m;t.classList.remove('hide');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.add('hide'),3500)};
function toggleMode(){mode=mode==='login'?'signup':'login';$('authTitle').textContent=$('authBtn').textContent=mode==='login'?'Log in':'Create account';$('toggle').textContent=mode==='login'?'No account? Sign up':'Have an account? Log in';$('amsg').textContent=''}
async function doAuth(){const email=$('em').value.trim(),password=$('pw').value;$('amsg').style.color='var(--red)';
 const r=mode==='login'?await sb.auth.signInWithPassword({email,password}):await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin}});
 if(r.error)return $('amsg').textContent=r.error.message;
 if(mode==='signup'&&!r.data.session){$('amsg').style.color='var(--grn)';$('amsg').textContent='Check your email to confirm your account, then log in.'}}
$('pw').addEventListener('keydown',e=>e.key==='Enter'&&doAuth());
sb.auth.onAuthStateChange((e,s)=>{const on=!!s;$('authView').classList.toggle('hide',on);$('appView').classList.toggle('hide',!on);if(on&&uid!==s.user.id){uid=s.user.id;$('email').textContent=s.user.email;setTimeout(boot,0)}if(!on)uid=null});
async function boot(){const[{data:st},{data:pl}]=await Promise.all([sb.from('fd_settings').select('prefs').maybeSingle(),sb.from('fd_plans').select('plan').maybeSingle()]);
 S=deep(structuredClone(DEF),st?.prefs||{});plan=pl?.plan||'free';theme();await load();syncPlan()}
async function load(){await Promise.all(['clients','projects','invoices','time'].map(async t=>{const{data,error}=await sb.from('fd_'+t).select('*').order('created_at',{ascending:false});if(error)toast(error.message);D[t]=data||[]}));render()}
async function saveS(){theme();const{error}=await sb.from('fd_settings').upsert({user_id:uid,prefs:S,updated_at:new Date().toISOString()});if(error)toast(error.message)}
function theme(){document.documentElement.dataset.theme=S.theme;document.documentElement.style.setProperty('--a',S.accent)}
const unpaid=i=>i.status!=='Paid',sum=(a,f)=>a.reduce((s,x)=>s+Number(typeof f==='function'?f(x):x[f]||0),0);
const isOD=i=>unpaid(i)&&i.due_date&&i.due_date<today();
const inv=i=>{const sub=(i.items||[]).length?sum(i.items,x=>(+x.qty||0)*(+x.price||0)):+i.amount||0;return sub*(1+(+i.tax_rate||0)/100)};
const cname=id=>(D.clients.find(c=>c.id===id)||{}).name||'';const pr=id=>D.projects.find(p=>p.id===id)||{};
const ydate=i=>i.paid_date||i.issue_date||i.created_at?.slice(0,10);
const VIEWS={home:'Home',clients:'Clients',projects:'Projects',time:'Time',invoices:'Invoices',contracts:'Contracts',reports:'Reports',settings:'Settings'};
function go(v){view=v;Q={};render()}
function render(){$('nav').innerHTML=Object.entries(VIEWS).map(([k,l])=>`<a class="${k===view?'on':''}" onclick="go('${k}')">${l}</a>`).join('');
 $('planBadge').innerHTML=plan==='free'?`<b>Free</b> · ${D.clients.length}/${LIMITS.clients} clients`:`<b>${PLAN_N[plan]||'Pro'}</b> · unlimited`;
 $('title').textContent=VIEWS[view];$('actions').innerHTML='';({home,clients:()=>list('clients'),projects:()=>list('projects'),time:timeV,invoices:()=>list('invoices'),contracts:contractsV,reports,settings})[view]()}
function kval(k){const t=today(),y=t.slice(0,4),m=t.slice(0,7);return{active:D.clients.filter(c=>c.status==='Active').length,pipeline:money(sum(D.projects.filter(p=>p.status!=='Done'),'value')),
 paid:money(sum(D.invoices.filter(i=>!unpaid(i)),inv)),outstanding:money(sum(D.invoices.filter(unpaid),inv)),overdue:D.invoices.filter(isOD).length,
 ytd:money(sum(D.invoices.filter(i=>!unpaid(i)&&(ydate(i)||'').startsWith(y)),inv)),hours:sum(D.time.filter(x=>x.work_date.startsWith(m)),'hours'),
 unbilled:money(sum(D.time.filter(x=>!x.billed),x=>x.hours*(+(D.clients.find(c=>c.id===pr(x.project_id).client_id)||{}).rate||0)))}[k]}
function months(n=12){const a=[],d=new Date();for(let i=n-1;i>=0;i--){const x=new Date(d.getFullYear(),d.getMonth()-i,15);a.push(x.toISOString().slice(0,7))}return a}
function incomeBy(){const r={};D.invoices.filter(i=>!unpaid(i)).forEach(i=>{const k=(ydate(i)||'').slice(0,7);r[k]=(r[k]||0)+inv(i)});return r}
function chart(){const ms=months(),r=incomeBy(),v=ms.map(m=>r[m]||0),mx=Math.max(1,...v),W=600,H=180,bw=W/ms.length;
 return `<svg viewBox="0 0 ${W} ${H+20}" width="100%">${v.map((x,i)=>{const h=x/mx*H;return`<rect class="bar" x="${i*bw+6}" y="${H-h}" width="${bw-12}" height="${h}" rx="3"><title>${ms[i]}: ${money(x)}</title></rect><text class="axis" x="${i*bw+bw/2}" y="${H+14}" text-anchor="middle">${new Date(ms[i]+'-15').toLocaleString(undefined,{month:'short'})}</text>`}).join('')}</svg>`}
function home(){$('actions').innerHTML=`<button class="ghost" onclick="go('settings')">Customize</button><button onclick="edit('invoices')">+ Invoice</button>`;
 const k=S.cards.filter(c=>c.on).map(c=>`<div class="card kpi"><div class="n">${kval(c.k)}</div><div class="l">${CARDS[c.k]}</div></div>`).join('');
 const od=D.invoices.filter(isOD);
 const empty=!D.clients.length?`<div class="card empty" style="margin-bottom:12px">Welcome! Start by <a href="#" onclick="go('clients');edit('clients');return false">adding your first client</a>.</div>`:'';
 $('view').innerHTML=empty+`<div class="kpis">${k}</div><div class="grid2">${S.widgets.chart?`<div class="card"><h3>Income, last 12 months</h3>${chart()}</div>`:''}${S.widgets.overdueList?`<div class="card"><h3>Overdue</h3>${od.length?od.map(i=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--ln);cursor:pointer" onclick="edit('invoices','${i.id}')"><span>${esc(i.number)} · ${esc(cname(i.client_id))}</span><b style="color:var(--red)">${money(inv(i))}</b></div>`).join(''):'<div class="muted">Nothing overdue 🎉</div>'}</div>`:''}</div>`}
const COLS={clients:[['Name',c=>esc(c.name)],['Email',c=>esc(c.email)],['Rate',c=>money(c.rate)+'/h'],['Status',c=>`<span class="pill">${esc(c.status)}</span>`]],
 projects:[['Project',p=>esc(p.name)],['Client',p=>esc(cname(p.client_id))],['Value',p=>money(p.value)],['Hours',p=>sum(D.time.filter(t=>t.project_id===p.id),'hours')],['Status',p=>`<span class="pill">${esc(p.status)}</span>`],['Due',p=>fdate(p.due_date)]],
 invoices:[['#',i=>esc(i.number)],['Client',i=>esc(cname(i.client_id))],['Total',i=>money(inv(i))],['Issued',i=>fdate(i.issue_date)],['Due',i=>fdate(i.due_date)],['Status',i=>`<span class="pill ${i.status==='Paid'?'paid':isOD(i)?'od':''}" onclick="event.stopPropagation();togglePaid('${i.id}')" title="Click to toggle">${isOD(i)?'Overdue':esc(i.status)}</span>`]]};
const STAT=t=>t==='invoices'?['Unpaid','Paid']:S.statuses[t];
const SING={clients:'client',projects:'project',invoices:'invoice'};
function list(t){$('actions').innerHTML=`<button class="ghost" onclick="csv('${t}')">Export CSV</button><button onclick="edit('${t}')">+ Add ${SING[t]}</button>`;
 const q=(Q.q||'').toLowerCase(),f=Q.f||'';
 const rows=D[t].filter(r=>(!f||(f==='Overdue'?isOD(r):r.status===f))&&(!q||JSON.stringify([r,cname(r.client_id)]).toLowerCase().includes(q)));
 const cf=S.fields[t]||[];
 const opts=[...STAT(t),...(t==='invoices'?['Overdue']:[])];
 $('view').innerHTML=`<div class="toolbar"><input id="qs" placeholder="Search…" value="${esc(Q.q||'')}" oninput="Q.q=this.value;list('${t}');const e=$('qs');e.focus();e.setSelectionRange(e.value.length,e.value.length)"><select onchange="Q.f=this.value;list('${t}')"><option value="">All statuses</option>${opts.map(o=>`<option ${o===f?'selected':''}>${esc(o)}</option>`).join('')}</select></div>
 <div class="card tw">${rows.length?`<table><tr>${COLS[t].map(c=>`<th>${c[0]}</th>`).join('')}${cf.map(c=>`<th>${esc(c)}</th>`).join('')}<th></th></tr>${rows.map(r=>`<tr class="click ${t==='invoices'&&isOD(r)?'overdue':''}" onclick="edit('${t}','${r.id}')">${COLS[t].map(c=>`<td>${c[1](r)}</td>`).join('')}${cf.map(c=>`<td>${esc((r.extra||{})[c])}</td>`).join('')}<td class="acts">${t==='invoices'?invActs(r):t==='clients'?`<button class="ghost sm" onclick="event.stopPropagation();portalLink('${r.id}')">Portal</button>`:''}<button class="x" onclick="event.stopPropagation();del('${t}','${r.id}')">✕</button></td></tr>`).join('')}</table>`:`<div class="empty">No ${t} yet.</div>`}</div>`}
async function del(t,id){if(!confirm('Delete this item?'))return;const{error}=await sb.from('fd_'+t).delete().eq('id',id);if(error)toast(error.message);load()}
async function togglePaid(id){const i=D.invoices.find(x=>x.id===id),p=i.status==='Paid';const{error}=await sb.from('fd_invoices').update({status:p?'Unpaid':'Paid',paid_date:p?null:today()}).eq('id',id);if(error)toast(error.message);load()}
const fld=(l,h,full)=>`<label class="${full?'full':''}">${l}${h}</label>`;
const inp=(id,v,type='text',x='')=>`<input id="${id}" type="${type}" value="${esc(v??'')}" ${x}>`;
const selx=(id,o,v,blank)=>`<select id="${id}">${blank?`<option value="">${blank}</option>`:''}${o.map(x=>Array.isArray(x)?`<option value="${x[0]}" ${x[0]===v?'selected':''}>${esc(x[1])}</option>`:`<option ${x===v?'selected':''}>${esc(x)}</option>`).join('')}</select>`;
const cl=()=>D.clients.map(c=>[c.id,c.name]);
let ITEMS=[];
function edit(t,id){const r=id?D[t].find(x=>x.id===id):{};const e=r.extra||{};let h='';
 if(t==='clients')h=fld('Name',inp('m_name',r.name))+fld('Email',inp('m_email',r.email,'email'))+fld('Hourly rate',inp('m_rate',r.rate,'number','step="any"'))+fld('Status',selx('m_status',STAT(t),r.status))+fld('Notes',`<textarea id="m_notes" rows="2">${esc(r.notes)}</textarea>`,1);
 if(t==='projects')h=fld('Project name',inp('m_name',r.name))+fld('Client',selx('m_client_id',cl(),r.client_id,'—'))+fld('Value',inp('m_value',r.value,'number','step="any"'))+fld('Status',selx('m_status',STAT(t),r.status))+fld('Due date',inp('m_due_date',r.due_date,'date'));
 if(t==='invoices'){ITEMS=structuredClone(r.items?.length?r.items:(r.amount?[{desc:'Services',qty:1,price:r.amount}]:[{desc:'',qty:1,price:0}]));
  const n=r.number||S.prefix+String(D.invoices.length+1).padStart(3,'0');
  h=fld('Invoice #',inp('m_number',n))+fld('Client',selx('m_client_id',cl(),r.client_id,'—'))+fld('Issue date',inp('m_issue_date',r.issue_date||today(),'date'))+fld('Due date',inp('m_due_date',r.due_date,'date'))+fld('Status',selx('m_status',STAT(t),r.status))+fld('Tax %',inp('m_tax_rate',r.tax_rate??S.tax,'number','step="any" oninput="itemsT()"'))+`<div class="full"><table class="items" id="items"></table><button class="ghost sm" onclick="ITEMS.push({desc:'',qty:1,price:0});itemsR()">+ Line item</button> <b id="itot" style="float:right"></b></div>`}
 h+=(S.fields[t]||[]).map((c,k)=>fld(esc(c),inp('cf_'+k,e[c]))).join('');
 $('modalBody').innerHTML=`<h3>${id?'Edit':'New'} ${SING[t]}</h3><div class="form">${h}</div><div class="btns">${id&&t==='invoices'?`<button class="ghost" onclick="printInv('${id}')">Print / PDF</button>`:''}<button class="ghost" onclick="closeModal()">Cancel</button><button onclick="saveRec('${t}','${id||''}')">Save</button></div>`;
 $('modal').classList.remove('hide');if(t==='invoices')itemsR();setTimeout(()=>$('modalBody').querySelector('input')?.focus(),0)}
function itemsR(){$('items').innerHTML='<tr><th>Description</th><th>Qty</th><th>Price</th><th></th></tr>'+ITEMS.map((x,k)=>`<tr><td><input value="${esc(x.desc)}" oninput="ITEMS[${k}].desc=this.value"></td><td style="width:70px"><input type="number" step="any" value="${x.qty}" oninput="ITEMS[${k}].qty=this.value;itemsT()"></td><td style="width:110px"><input type="number" step="any" value="${x.price}" oninput="ITEMS[${k}].price=this.value;itemsT()"></td><td><button class="x" onclick="ITEMS.splice(${k},1);itemsR()">✕</button></td></tr>`).join('');itemsT()}
function itemsT(){$('itot').textContent='Total '+money(inv({items:ITEMS,tax_rate:$('m_tax_rate').value}))}
function closeModal(){$('modal').classList.add('hide')}
async function saveRec(t,id){const v=k=>{const e=$('m_'+k);return e?(e.value===''?null:e.value):undefined};const r={};
 ({clients:['name','email','rate','status','notes'],projects:['name','client_id','value','status','due_date'],invoices:['number','client_id','issue_date','due_date','status','tax_rate']})[t].forEach(k=>r[k]=v(k));
 if((t!=='invoices')&&!r.name)return toast('Name is required');
 ['rate','value','tax_rate'].forEach(k=>k in r&&(r[k]=+r[k]||0));
 if(t==='invoices'){r.items=ITEMS.filter(x=>x.desc||+x.price).map(x=>({desc:x.desc,qty:+x.qty||0,price:+x.price||0}));r.amount=sum(r.items,x=>x.qty*x.price);const old=id&&D.invoices.find(x=>x.id===id);r.paid_date=r.status==='Paid'?(old?.paid_date||today()):null}
 const old=id?(D[t].find(x=>x.id===id).extra||{}):{};r.extra={...old};(S.fields[t]||[]).forEach((c,k)=>r.extra[c]=$('cf_'+k).value);
 const{error}=id?await sb.from('fd_'+t).update(r).eq('id',id):await sb.from('fd_'+t).insert(r);
 if(error)return toast(error.message.includes('Free plan')?error.message:error.message);closeModal();toast('Saved');load()}
let SEL=new Set();
function timeV(){$('actions').innerHTML=`<button class="ghost" onclick="csv('time')">Export CSV</button><button class="ghost" onclick="billSel()">Invoice selected</button>`;
 const ps=D.projects.map(p=>[p.id,p.name+(p.client_id?' · '+cname(p.client_id):'')]);
 const f=Q.f||'unbilled',rows=D.time.filter(x=>f==='all'||(f==='billed')===x.billed);
 $('view').innerHTML=`<div class="card" style="margin-bottom:12px"><div class="toolbar" style="margin:0">${selx('t_p',ps,null,'Project…')}${inp('t_d',today(),'date','style="max-width:160px"')}${inp('t_h','','number','placeholder="Hours" step="0.25" style="max-width:100px"')}${inp('t_n','','text','placeholder="What did you work on?"')}<button onclick="addTime()">Log time</button></div></div>
 <div class="toolbar"><select onchange="Q.f=this.value;SEL.clear();timeV()">${[['unbilled','Unbilled'],['billed','Billed'],['all','All']].map(o=>`<option value="${o[0]}" ${o[0]===f?'selected':''}>${o[1]}</option>`).join('')}</select><span class="muted" style="align-self:center">${sum(rows,'hours')} h shown</span></div>
 <div class="card tw">${rows.length?`<table><tr><th></th><th>Date</th><th>Project</th><th>Client</th><th>Hours</th><th>Note</th><th>Billed</th><th></th></tr>${rows.map(x=>{const p=pr(x.project_id);return`<tr><td>${x.billed?'':`<input type="checkbox" style="width:auto" ${SEL.has(x.id)?'checked':''} onchange="this.checked?SEL.add('${x.id}'):SEL.delete('${x.id}')">`}</td><td>${fdate(x.work_date)}</td><td>${esc(p.name)}</td><td>${esc(cname(p.client_id))}</td><td>${x.hours}</td><td>${esc(x.note)}</td><td>${x.billed?'✓':''}</td><td><button class="x" onclick="del('time','${x.id}')">✕</button></td></tr>`}).join('')}</table>`:'<div class="empty">No time entries.</div>'}</div>`}
async function addTime(){const project_id=$('t_p').value||null,hours=+$('t_h').value;if(!hours)return toast('Enter hours');
 const{error}=await sb.from('fd_time').insert({project_id,hours,work_date:$('t_d').value||today(),note:$('t_n').value});if(error)return toast(error.message);toast('Logged');load()}
async function billSel(){const es=D.time.filter(x=>SEL.has(x.id));if(!es.length)return toast('Tick some unbilled entries first');
 const cs=[...new Set(es.map(x=>pr(x.project_id).client_id))];if(cs.length>1)return toast('Pick entries for one client at a time');
 const c=D.clients.find(x=>x.id===cs[0])||{},by={};es.forEach(x=>{const n=pr(x.project_id).name||'Time';by[n]=(by[n]||0)+Number(x.hours)});
 const items=Object.entries(by).map(([n,h])=>({desc:n+' (hours)',qty:h,price:+c.rate||0}));
 const r={number:S.prefix+String(D.invoices.length+1).padStart(3,'0'),client_id:c.id||null,items,amount:sum(items,x=>x.qty*x.price),tax_rate:+S.tax||0,status:'Unpaid',issue_date:today(),due_date:new Date(Date.now()+14*864e5).toISOString().slice(0,10)};
 const{data,error}=await sb.from('fd_invoices').insert(r).select().single();if(error)return toast(error.message);
 await sb.from('fd_time').update({billed:true}).in('id',[...SEL]);SEL.clear();await load();go('invoices');edit('invoices',data.id)}
function reports(){const y=+(Q.y||new Date().getFullYear()),paid=D.invoices.filter(i=>!unpaid(i)&&(ydate(i)||'').startsWith(y));
 const yrs=[...new Set([new Date().getFullYear(),...D.invoices.map(i=>+(ydate(i)||'').slice(0,4)).filter(Boolean)])].sort((a,b)=>b-a);
 const bm=Array.from({length:12},(_,m)=>sum(paid.filter(i=>+ydate(i).slice(5,7)===m+1),inv));
 const bc={};paid.forEach(i=>{const n=cname(i.client_id)||'(no client)';bc[n]=(bc[n]||0)+inv(i)});const tot=sum(bm,x=>x);
 const tax=sum(paid,i=>inv(i)-inv({...i,tax_rate:0}));
 $('actions').innerHTML=`<select onchange="Q.y=this.value;reports()">${yrs.map(x=>`<option ${x===y?'selected':''}>${x}</option>`).join('')}</select><button class="ghost" onclick="csvReport(${y})">Export CSV</button>`;
 $('view').innerHTML=`<div class="kpis"><div class="card kpi"><div class="n">${money(tot)}</div><div class="l">Income ${y}</div></div><div class="card kpi"><div class="n">${money(tax)}</div><div class="l">Tax collected</div></div><div class="card kpi"><div class="n">${money(tot/Math.max(1,y===new Date().getFullYear()?new Date().getMonth()+1:12))}</div><div class="l">Avg per month</div></div><div class="card kpi"><div class="n">${paid.length}</div><div class="l">Invoices paid</div></div></div>
 <div class="grid2"><div class="card tw"><h3>By month</h3><table>${bm.map((v,m)=>`<tr><td>${new Date(y,m,15).toLocaleString(undefined,{month:'long'})}</td><td style="text-align:right">${money(v)}</td></tr>`).join('')}</table></div>
 <div class="card tw"><h3>By client</h3>${Object.keys(bc).length?`<table>${Object.entries(bc).sort((a,b)=>b[1]-a[1]).map(([n,v])=>`<tr><td>${esc(n)}</td><td style="text-align:right">${money(v)}</td><td class="muted sm">${Math.round(v/tot*100)}%</td></tr>`).join('')}</table>`:'<div class="muted">No paid invoices.</div>'}</div></div>`}
function dl(name,rows){const s=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:'text/csv'}));a.download=name;a.click()}
function csv(t){const cf=S.fields[t]||[];const map={clients:[['Name','name'],['Email','email'],['Rate','rate'],['Status','status'],['Notes','notes']],projects:[['Project','name'],['Client',r=>cname(r.client_id)],['Value','value'],['Status','status'],['Due','due_date']],
 invoices:[['Number','number'],['Client',r=>cname(r.client_id)],['Subtotal',r=>inv({...r,tax_rate:0}).toFixed(2)],['Tax %','tax_rate'],['Total',r=>inv(r).toFixed(2)],['Status','status'],['Issued','issue_date'],['Due','due_date'],['Paid','paid_date']],
 time:[['Date','work_date'],['Project',r=>pr(r.project_id).name],['Client',r=>cname(pr(r.project_id).client_id)],['Hours','hours'],['Note','note'],['Billed','billed']]}[t];
 dl(t+'.csv',[[...map.map(m=>m[0]),...cf],...D[t].map(r=>[...map.map(m=>typeof m[1]==='function'?m[1](r):r[m[1]]),...cf.map(c=>(r.extra||{})[c])])])}
function csvReport(y){const paid=D.invoices.filter(i=>!unpaid(i)&&(ydate(i)||'').startsWith(y));dl(`income-${y}.csv`,[['Paid date','Invoice','Client','Total'],...paid.map(i=>[ydate(i),i.number,cname(i.client_id),inv(i).toFixed(2)])])}
function printInv(id){const i=D.invoices.find(x=>x.id===id),c=D.clients.find(x=>x.id===i.client_id)||{},b=S.biz,items=i.items?.length?i.items:[{desc:'Services',qty:1,price:i.amount}],sub=inv({...i,tax_rate:0});
 const w=window.open('','_blank');w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(i.number)}</title><style>body{font:14px system-ui,sans-serif;color:#18181B;max-width:760px;margin:40px auto;padding:0 24px}h1{color:${S.accent};margin:0}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{padding:8px;border-bottom:1px solid #e5e5e5;text-align:left}th:last-child,td:last-child,.r{text-align:right}.top{display:flex;justify-content:space-between}img{max-height:60px}.mu{color:#71717A}@media print{button{display:none}}</style></head><body>
 <div class="top"><div>${b.logo?`<img src="${esc(b.logo)}"><br>`:''}<b>${esc(b.name||'Your business')}</b><div class="mu">${esc(b.email)}<br>${esc(b.address).replace(/\n/g,'<br>')}</div></div><div class="r"><h1>INVOICE</h1><div>${esc(i.number)}</div><div class="mu">Issued ${fdate(i.issue_date)}<br>Due ${fdate(i.due_date)}</div></div></div>
 <p><span class="mu">Bill to</span><br><b>${esc(c.name)}</b><br>${esc(c.email)}</p>
 <table><tr><th>Description</th><th>Qty</th><th>Price</th><th>Amount</th></tr>${items.map(x=>`<tr><td>${esc(x.desc)}</td><td>${x.qty}</td><td>${money(x.price)}</td><td>${money(x.qty*x.price)}</td></tr>`).join('')}</table>
 <div class="r">Subtotal ${money(sub)}<br>${+i.tax_rate?`Tax (${i.tax_rate}%) ${money(inv(i)-sub)}<br>`:''}<h2>Total ${money(inv(i))}</h2>${i.status==='Paid'?'<b style="color:#15803D">PAID</b>':''}</div>
 <button onclick="print()">Print / Save as PDF</button></body></html>`);w.document.close()}
function settings(){const b=S.biz,ENT={clients:'Clients',projects:'Projects',invoices:'Invoices'};
 const chips=(arr,path)=>`<div class="chips">${arr.map((x,k)=>`<span>${esc(x)}<button class="x" onclick="rmChip('${path}',${k})">✕</button></span>`).join('')}</div><div class="row">${inp('add_'+path.replace('.','_'),'','text','placeholder="Add…" style="max-width:220px"')}<button class="ghost sm" onclick="addChip('${path}')">Add</button></div>`;
 $('view').innerHTML=`<div class="set">
 <div class="card"><h3>Appearance</h3><div class="form">${fld('Theme',selx('s_theme',[['light','Light'],['dark','Dark']],S.theme))}${fld('Accent color',inp('s_accent',S.accent,'color','style="height:38px;padding:2px"'))}</div></div>
 <div class="card"><h3>Regional</h3><div class="form">${fld('Currency',selx('s_currency',['USD','EUR','GBP','CAD','AUD','ILS','INR','JPY','CHF','ZAR','BRL','MXN'],S.currency))}${fld('Date format',selx('s_dateFmt',['YYYY-MM-DD','MM/DD/YYYY','DD/MM/YYYY'],S.dateFmt))}${fld('Default tax %',inp('s_tax',S.tax,'number','step="any"'))}${fld('Invoice number prefix',inp('s_prefix',S.prefix))}</div></div>
 <div class="card"><h3>Business details (shown on invoices)</h3><div class="form">${fld('Business name',inp('b_name',b.name))}${fld('Email',inp('b_email',b.email))}${fld('Logo image URL',inp('b_logo',b.logo),1)}${fld('Address',`<textarea id="b_address" rows="2">${esc(b.address)}</textarea>`,1)}</div></div>
 <div class="btns" style="margin:0;justify-content:flex-start"><button onclick="saveForm()">Save settings</button></div>
 <div class="card"><h3>Home dashboard cards</h3><p class="muted sm">Show, hide and reorder.</p><div class="cardlist">${S.cards.map((c,k)=>`<div><input type="checkbox" style="width:auto" ${c.on?'checked':''} onchange="S.cards[${k}].on=this.checked;saveS()"><span>${CARDS[c.k]}</span><button class="ghost sm" onclick="mv(${k},-1)">↑</button><button class="ghost sm" onclick="mv(${k},1)">↓</button></div>`).join('')}
 <div><input type="checkbox" style="width:auto" ${S.widgets.chart?'checked':''} onchange="S.widgets.chart=this.checked;saveS()"><span>Income chart</span></div><div><input type="checkbox" style="width:auto" ${S.widgets.overdueList?'checked':''} onchange="S.widgets.overdueList=this.checked;saveS()"><span>Overdue list</span></div></div></div>
 <div class="card"><h3>Pipeline stages</h3><p class="muted sm">Client statuses</p>${chips(S.statuses.clients,'statuses.clients')}<p class="muted sm" style="margin-top:10px">Project statuses</p>${chips(S.statuses.projects,'statuses.projects')}</div>
 <div class="card"><h3>Custom fields</h3>${Object.entries(ENT).map(([k,l])=>`<p class="muted sm" style="margin-top:8px">${l}</p>${chips(S.fields[k],'fields.'+k)}`).join('')}</div>
 ${planCard()}
 <div class="card"><h3>Your data</h3><div class="row">${['clients','projects','invoices','time'].map(t=>`<button class="ghost sm" onclick="csv('${t}')">Export ${t}</button>`).join('')}</div></div></div>`}
const getP=p=>p.split('.').reduce((o,k)=>o[k],S);
function addChip(p){const e=$('add_'+p.replace('.','_')),v=e.value.trim();if(!v)return;const a=getP(p);if(!a.includes(v))a.push(v);saveS();settings()}
function rmChip(p,k){const a=getP(p);if(p.startsWith('statuses')&&a.length<=1)return toast('Keep at least one status');a.splice(k,1);saveS();settings()}
function mv(k,d){const j=k+d;if(j<0||j>=S.cards.length)return;[S.cards[k],S.cards[j]]=[S.cards[j],S.cards[k]];saveS();settings()}
async function saveForm(){['theme','accent','currency','dateFmt','prefix'].forEach(k=>S[k]=$('s_'+k).value);S.tax=+$('s_tax').value||0;['name','email','logo','address'].forEach(k=>S.biz[k]=$('b_'+k).value);await saveS();toast('Settings saved');render()}
document.addEventListener('keydown',e=>e.key==='Escape'&&closeModal());

/* Mobile: viewport, stylesheet, stacked tables */
(function(){
 const vp=document.querySelector('meta[name=viewport]');if(vp)vp.content='width=device-width, initial-scale=1.0, viewport-fit=cover';
 const tc=document.createElement('meta');tc.name='theme-color';tc.content='#FAFAF9';document.head.appendChild(tc);
 const l=document.createElement('link');l.rel='stylesheet';l.href='mobile.css?v=1';document.head.appendChild(l);
 const label=()=>document.querySelectorAll('#view .tw table').forEach(t=>{const rows=t.rows;if(!rows.length)return;const h=[...rows[0].cells].map(c=>c.tagName==='TH'?c.textContent.trim():'');if(!h.some(Boolean))return;t.classList.add('stack');for(let i=1;i<rows.length;i++)[...rows[i].cells].forEach((c,j)=>{if(h[j]&&!c.dataset.label)c.dataset.label=h[j]})});
 const v=document.getElementById('view');if(v)new MutationObserver(label).observe(v,{childList:true,subtree:true});
})();
/* Branding: Dashline */
document.title='Dashline';document.querySelectorAll('.logo').forEach(e=>e.innerHTML='Dash<span>line</span>');

/* Dashline tiers, payments, email, client portal */
const PLAN_N={free:'Free',pro:'Pro',business:'Business'};
const has=t=>t==='pro'?plan!=='free':plan==='business';
async function api(path,body){const{data:{session}}=await sb.auth.getSession();const r=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify(body||{})});const j=await r.json().catch(()=>({error:'Server error'}));if(!r.ok)throw new Error(j.error||'Request failed');return j}
function need(t){if(has(t))return true;toast(`${t==='pro'?'Pro':'Business'} feature. Upgrade in Settings → Plan.`);return false}
async function syncPlan(){const q=new URLSearchParams(location.search);if(q.get('checkout')){history.replaceState(null,'',location.pathname);if(q.get('checkout')==='success')toast('Payment received. Activating your plan…')}
 try{const r=await api('sync');if(r.plan&&r.plan!==plan){plan=r.plan;toast(`You're on ${PLAN_N[plan]} now`);render()}if(r.paid)load()}catch(e){console.warn(e.message)}}
async function upgrade(tier){try{toast('Opening secure checkout…');const r=await api('checkout',{tier});if(r.url)location.href=r.url;else{plan=r.changed;toast(`Switched to ${PLAN_N[plan]}`);render()}}catch(e){toast(e.message)}}
async function billing(){try{const r=await api('billing');location.href=r.url}catch(e){toast(e.message)}}
function planCard(){const T=[['free','Free','$0',`${LIMITS.clients} clients, ${LIMITS.projects} projects, ${LIMITS.invoices} invoices`],['pro','Pro','$9/mo','Unlimited, online pay links, emailed invoices'],['business','Business','$19/mo','Everything in Pro + automatic overdue reminders, contracts with e-signature, client portal']];
 return `<div class="card"><h3>Plan</h3><p>You are on <b>${PLAN_N[plan]}</b>.</p><div class="tiers">${T.map(([k,n,p,d])=>`<div class="tier ${k===plan?'cur':''}"><b>${n}</b> <span class="muted">${p}</span><div class="muted sm">${d}</div>${k===plan?'<div class="sm"><b>Current plan</b></div>':k!=='free'?`<button class="sm" onclick="upgrade('${k}')">${plan==='business'&&k==='pro'?'Switch to':'Upgrade to'} ${n}</button>`:''}</div>`).join('')}</div>${plan!=='free'?`<button class="ghost sm" style="margin-top:10px" onclick="billing()">Manage billing / cancel</button>`:''}</div>`}
function invActs(r){const ev='event.stopPropagation();';return `<button class="ghost sm" onclick="${ev}printInv('${r.id}')">PDF</button><button class="ghost sm" onclick="${ev}emailInv('${r.id}')">${r.sent_at?'Resend':'Email'}</button>${r.status!=='Paid'?`<button class="ghost sm" onclick="${ev}payLink('${r.id}')">Pay link</button>${isOD(r)?`<button class="ghost sm" onclick="${ev}emailInv('${r.id}',true)">Remind</button>`:''}`:''}`}
async function copy(txt,msg){try{await navigator.clipboard.writeText(txt);toast(msg)}catch{prompt('Copy this link:',txt)}}
async function emailInv(id,reminder){if(!need(reminder?'business':'pro'))return;const i=D.invoices.find(x=>x.id===id);if(!i.client_id)return toast('Pick a client for this invoice first');try{toast('Sending…');const r=await api('send-invoice',{invoice_id:id,reminder:!!reminder});toast(`${reminder?'Reminder':'Invoice'} emailed to ${r.to}`);load()}catch(e){toast(e.message)}}
function payLink(id){if(!need('pro'))return;const i=D.invoices.find(x=>x.id===id),c=D.clients.find(x=>x.id===i.client_id);if(!c)return toast('Pick a client for this invoice first');copy(`${location.origin}/api/pay?t=${c.portal_token}&i=${id}`,'Pay link copied')}
function portalLink(id){if(!need('business'))return;const c=D.clients.find(x=>x.id===id);copy(`${location.origin}/portal.html?t=${c.portal_token}`,'Client portal link copied')}
(function(){const st=document.createElement('style');st.textContent='.tiers{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:8px}.tier{border:1px solid var(--ln);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:6px}.tier.cur{border:2px solid var(--a)}.acts{white-space:nowrap}.acts .sm{margin-right:4px}@media(max-width:700px){#nav{overflow-x:auto;justify-content:flex-start!important;scrollbar-width:none}#nav a{flex:0 0 auto!important;min-width:64px}.acts{white-space:normal;display:flex;flex-wrap:wrap;gap:6px}}';document.head.appendChild(st)})();

/* Contracts with e-signature (Business) */
D.contracts=[];
const TPL=`This agreement is between [Your business] ("Freelancer") and [Client] ("Client").\n\n1. Scope of work\n[Describe the deliverables.]\n\n2. Timeline\n[Start date, milestones and delivery date.]\n\n3. Fees and payment\n[Total fee or hourly rate.] Invoices are due within 14 days.\n\n4. Revisions\n[Number of revision rounds included.]\n\n5. Ownership\nOn full payment, the Client owns the final deliverables.\n\n6. Cancellation\nEither party may cancel with written notice. Work completed to date will be invoiced.`;
async function contractsV(){$('actions').innerHTML=has('business')?`<button onclick="editK()">+ New contract</button>`:'';
 if(!has('business')){$('view').innerHTML=`<div class="card empty"><h3>Contracts with e-signature</h3><p>Send contracts your clients sign online from any device. Available on Business.</p><button onclick="upgrade('business')">Upgrade to Business ($19/mo)</button></div>`;return}
 const{data,error}=await sb.from('fd_contracts').select('*').order('created_at',{ascending:false});if(error)toast(error.message);const K=D.contracts=data||[];
 $('view').innerHTML=`<div class="card tw">${K.length?`<table><tr><th>Title</th><th>Client</th><th>Status</th><th>Signed</th><th></th></tr>${K.map(k=>`<tr class="click" onclick="editK('${k.id}')"><td>${esc(k.title)}</td><td>${esc(cname(k.client_id))}</td><td><span class="pill ${k.status==='Signed'?'paid':''}">${esc(k.status)}</span></td><td>${k.signed_at?esc(k.signed_name)+' · '+fdate(k.signed_at.slice(0,10)):''}</td><td class="acts">${k.status!=='Signed'?`<button class="ghost sm" onclick="event.stopPropagation();sendK('${k.id}')">${k.status==='Sent'?'Resend':'Send'}</button>`:''}${k.status!=='Draft'?`<button class="ghost sm" onclick="event.stopPropagation();copy(location.origin+'/sign.html?t=${k.token}','Signing link copied')">Link</button>`:''}<button class="x" onclick="event.stopPropagation();delK('${k.id}')">✕</button></td></tr>`).join('')}</table>`:`<div class="empty">No contracts yet.</div>`}</div>`}
function editK(id){const k=id?D.contracts.find(x=>x.id===id):{title:'',body:TPL.replace('[Your business]',S.biz.name||'[Your business]')};const lock=k.status==='Signed',a=id?`'${id}'`:'null';
 $('modalBody').innerHTML=`<h3>${lock?'Signed contract':id?'Edit contract':'New contract'}</h3><div class="form">${fld('Title',inp('k_title',k.title,'text',lock?'disabled':''),1)}${fld('Client',selx('k_client',cl(),k.client_id,'— choose —'),1)}${fld('Contract text',`<textarea id="k_body" rows="14" ${lock?'disabled':''}>${esc(k.body)}</textarea>`,1)}</div>${lock?`<p class="muted sm">Signed by ${esc(k.signed_name)} on ${new Date(k.signed_at).toLocaleString()}.</p>`:''}<div class="btns"><button class="ghost" onclick="closeModal()">Close</button>${lock?'':`<button class="ghost" onclick="saveK(${a})">Save draft</button><button onclick="saveK(${a},true)">Save & send</button>`}</div>`;$('modal').classList.remove('hide')}
async function saveK(id,send){const r={title:$('k_title').value.trim(),client_id:$('k_client').value||null,body:$('k_body').value};if(!r.title)return toast('Add a title');
 const{data,error}=await(id?sb.from('fd_contracts').update(r).eq('id',id):sb.from('fd_contracts').insert(r)).select().single();if(error)return toast(error.message);closeModal();if(send)await sendK(data.id);else{toast('Saved');contractsV()}}
async function sendK(id){try{toast('Sending…');const r=await api('send-contract',{contract_id:id});toast('Contract sent to '+r.to)}catch(e){toast(e.message)}contractsV()}
async function delK(id){if(!confirm('Delete this contract?'))return;const{error}=await sb.from('fd_contracts').delete().eq('id',id);if(error)toast(error.message);contractsV()}
