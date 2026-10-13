const sb=supabase.createClient('https://cjtutkvhyzjsgclqvylg.supabase.co','sb_publishable_E48ovT9wWxduLxnzPXL_5g_SnNl2rqz');
let mode='login',cur='clients',D={clients:[],projects:[],invoices:[]};
const $=i=>document.getElementById(i),money=n=>'$'+Number(n||0).toLocaleString(),today=()=>new Date().toISOString().slice(0,10);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
function toggleMode(){mode=mode==='login'?'signup':'login';$('authTitle').textContent=$('authBtn').textContent=mode==='login'?'Log in':'Create account';$('toggle').textContent=mode==='login'?'No account? Sign up':'Have an account? Log in';$('amsg').textContent=''}
async function doAuth(){const email=$('em').value,password=$('pw').value;$('amsg').style.color='#b42318';
const r=mode==='login'?await sb.auth.signInWithPassword({email,password}):await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin}});
if(r.error)return $('amsg').textContent=r.error.message;
if(mode==='signup'&&!r.data.session){$('amsg').style.color='#008300';$('amsg').textContent='Check your email to confirm your account, then log in.'}}
sb.auth.onAuthStateChange((e,s)=>{const on=!!s;$('authView').classList.toggle('hide',on);$('appView').classList.toggle('hide',!on);$('who').classList.toggle('hide',!on);if(on){$('email').textContent=s.user.email;setTimeout(load,0)}});
async function load(){for(const t of Object.keys(D)){const{data}=await sb.from('fd_'+t).select('*').order('created_at');D[t]=data||[]}kpis();render()}
const unpaid=i=>i.status!=='Paid',sum=(a,f)=>a.reduce((s,x)=>s+Number(x[f]||0),0);
function kpis(){$('k1').textContent=D.clients.filter(c=>c.status==='Active').length;$('k2').textContent=money(sum(D.projects.filter(p=>p.status!=='Done'),'value'));
$('k3').textContent=money(sum(D.invoices.filter(i=>!unpaid(i)),'amount'));$('k4').textContent=money(sum(D.invoices.filter(unpaid),'amount'));
$('k5').textContent=D.invoices.filter(i=>unpaid(i)&&i.due_date&&i.due_date<today()).length}
function tab(b){document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('on'));b.classList.add('on');cur=b.dataset.t;render()}
async function del(id){if(!confirm('Delete this item?'))return;await sb.from('fd_'+cur).delete().eq('id',id);load()}
async function togglePaid(id,s){await sb.from('fd_invoices').update({status:s==='Paid'?'Unpaid':'Paid'}).eq('id',id);load()}
const cname=id=>(D.clients.find(c=>c.id===id)||{}).name||'';
const copts=()=>'<select id="f2"><option value="">Client…</option>'+D.clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')+'</select>';
const sel=o=>`<select id="f4">${o.map(x=>`<option>${x}</option>`).join('')}</select>`;
const X=id=>`<td><button class="x" onclick="del('${id}')">✕</button></td>`;
const tbl=(hd,rows)=>`<table><tr>${hd.map(x=>`<th>${x}</th>`).join('')}<th></th></tr>${rows}</table>`;
function render(){let h;const t=today();
if(cur==='clients')h=`<div class="row"><input id="f1" placeholder="Name"><input id="f2" placeholder="Email"><input id="f3" type="number" placeholder="Hourly rate">${sel(['Active','Lead','Inactive'])}<button onclick="add()">Add client</button></div>`+
tbl(['Name','Email','Rate','Status'],D.clients.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.email)}</td><td>${money(c.rate)}/h</td><td>${esc(c.status)}</td>${X(c.id)}</tr>`).join(''));
if(cur==='projects')h=`<div class="row"><input id="f1" placeholder="Project name">${copts()}<input id="f3" type="number" placeholder="Value">${sel(['In progress','Proposal','Done'])}<input id="f5" type="date"><button onclick="add()">Add project</button></div>`+
tbl(['Project','Client','Value','Status','Due'],D.projects.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(cname(p.client_id))}</td><td>${money(p.value)}</td><td>${esc(p.status)}</td><td>${p.due_date||''}</td>${X(p.id)}</tr>`).join(''));
if(cur==='invoices')h=`<div class="row"><input id="f1" placeholder="Invoice #">${copts()}<input id="f3" type="number" placeholder="Amount">${sel(['Unpaid','Paid'])}<input id="f5" type="date"><button onclick="add()">Add invoice</button></div>`+
tbl(['#','Client','Amount','Status (click to toggle)','Due'],D.invoices.map(i=>`<tr class="${unpaid(i)&&i.due_date&&i.due_date<t?'overdue':''}"><td>${esc(i.number)}</td><td>${esc(cname(i.client_id))}</td><td>${money(i.amount)}</td><td><span class="link" style="margin:0" onclick="togglePaid('${i.id}','${i.status}')">${esc(i.status)}</span></td><td>${i.due_date||''}</td>${X(i.id)}</tr>`).join(''));
$('pane').innerHTML=h}
async function add(){const v=i=>($(i)||{}).value||null;let r;
if(cur==='clients'){if(!v('f1'))return;r={name:v('f1'),email:v('f2'),rate:v('f3')||0,status:v('f4')}}
if(cur==='projects'){if(!v('f1'))return;r={name:v('f1'),client_id:v('f2'),value:v('f3')||0,status:v('f4'),due_date:v('f5')}}
if(cur==='invoices')r={number:v('f1'),client_id:v('f2'),amount:v('f3')||0,status:v('f4'),due_date:v('f5')};
const{error}=await sb.from('fd_'+cur).insert(r);if(error)alert(error.message);load()}
