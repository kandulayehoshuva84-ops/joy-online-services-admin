import React,{useEffect,useState}from'react';
import{createRoot}from'react-dom/client';
import{supabase}from'./supabase';
import'./styles.css';

const BUCKET='Documents';

function Login(){
const[email,setEmail]=useState('');
const[password,setPassword]=useState('');
const[err,setErr]=useState('');
const[busy,setBusy]=useState(false);
const[forgot,setForgot]=useState(false);
const[msg,setMsg]=useState('');

async function login(e){
e.preventDefault();
setBusy(true);
setErr('');
const{error}=await supabase.auth.signInWithPassword({email,password});
if(error)setErr(error.message);
setBusy(false);
}

async function reset(e){
e.preventDefault();
setBusy(true);
setErr('');
setMsg('');

const{error}=await supabase.auth.resetPasswordForEmail(email,{
redirectTo:window.location.origin+'/'
});

if(error)setErr(error.message);
else setMsg('Reset link sent. Please open the newest email.');

setBusy(false);
}

if(forgot)
return <div className="login">
<form className="loginbox" onSubmit={reset}>
<div className="logo">J</div>
<h1>JOY ONLINE SERVICES</h1>
<p>Reset Admin Password</p>

<label>Email</label>
<input
type="email"
required
value={email}
onChange={e=>setEmail(e.target.value)}
/>

{err&&<div className="err">{err}</div>}
{msg&&<div className="success">{msg}</div>}

<button className="primary" disabled={busy}>
{busy?'Sending…':'Send Reset Link'}
</button>

<button
type="button"
className="secondary"
onClick={()=>{
setForgot(false);
setErr('');
setMsg('');
}}>
Back to Login
</button>
</form>
</div>;

return <div className="login">
<form className="loginbox" onSubmit={login}>
<div className="logo">J</div>
<h1>JOY ONLINE SERVICES</h1>
<p>Secure Admin Portal</p>

<label>Email</label>
<input
type="email"
required
value={email}
onChange={e=>setEmail(e.target.value)}
/>

<label>Password</label>
<input
type="password"
required
value={password}
onChange={e=>setPassword(e.target.value)}
/>

{err&&<div className="err">{err}</div>}

<button className="primary" disabled={busy}>
{busy?'Signing in…':'Admin Login'}
</button>

<button
type="button"
className="linkbutton"
onClick={()=>{
setForgot(true);
setErr('');
}}>
Forgot password?
</button>
</form>
</div>;
}


function ResetPassword(){
const[p,setP]=useState('');
const[c,setC]=useState('');
const[err,setErr]=useState('');
const[msg,setMsg]=useState('');
const[busy,setBusy]=useState(false);

async function save(e){
e.preventDefault();
setErr('');
setMsg('');

if(p.length<6)
return setErr('Password must be at least 6 characters.');

if(p!==c)
return setErr('Passwords do not match.');

setBusy(true);

const{error}=await supabase.auth.updateUser({
password:p
});

if(error){
setErr(error.message);
}else{
setMsg('Password changed successfully.');

setTimeout(()=>{
window.location.href=window.location.origin;
},1500);
}

setBusy(false);
}

return <div className="login">
<form className="loginbox" onSubmit={save}>

<div className="logo">J</div>
<h1>JOY ONLINE SERVICES</h1>
<p>Set New Admin Password</p>

<label>New Password</label>
<input
type="password"
minLength="6"
required
value={p}
onChange={e=>setP(e.target.value)}
/>

<label>Confirm Password</label>
<input
type="password"
minLength="6"
required
value={c}
onChange={e=>setC(e.target.value)}
/>

{err&&<div className="err">{err}</div>}
{msg&&<div className="success">{msg}</div>}

<button className="primary" disabled={busy}>
{busy?'Saving…':'Change Password'}
</button>

</form>
</div>;
}


function App(){
  const[session,setSession]=useState(null);
  const[profile,setProfile]=useState(null);
  const[loading,setLoading]=useState(true);
  const[recovery,setRecovery]=useState(false);

  useEffect(()=>{
    let mounted=true;

    async function init(){
      try{
        const hash=window.location.hash||'';
        const params=new URLSearchParams(
          hash.startsWith('#') ? hash.slice(1) : hash
        );

        const accessToken=params.get('access_token');
        const refreshToken=params.get('refresh_token');
        const type=params.get('type');

        if(accessToken && refreshToken){
          const{data,error}=await supabase.auth.setSession({
            access_token:accessToken,
            refresh_token:refreshToken
          });

          if(error){
            console.error(error);
          }else if(mounted){
            setSession(data.session);
            setRecovery(true);
          }
        }else{
          const{data}=await supabase.auth.getSession();

          if(mounted){
            setSession(data.session);

            if(type==='recovery'){
              setRecovery(true);
            }
          }
        }
      }catch(error){
        console.error(error);
      }finally{
        if(mounted)setLoading(false);
      }
    }

    init();

    const{data}=supabase.auth.onAuthStateChange((event,s)=>{
      if(event==='PASSWORD_RECOVERY'){
        setRecovery(true);
      }

      if(mounted)setSession(s);
    });

    return()=>{
      mounted=false;
      data.subscription.unsubscribe();
    };
  },[]);

  useEffect(()=>{
    if(!session){
      setProfile(null);
      return;
    }

    supabase
      .from('profiles')
      .select('id,full_name,role')
      .eq('id',session.user.id)
      .single()
      .then(({data})=>{
        setProfile(data);
      });
  },[session]);

  if(loading){
    return <div className="center">Loading…</div>;
  }

  if(recovery){
    if(!session){
      return <div className="center">Preparing secure password reset…</div>;
    }

    return <ResetPassword/>;
  }

  if(!session){
    return <Login/>;
  }

  if(!profile||profile.role!=='admin'){
    return(
      <div className="center">
        <div className="card">
          <h2>Access denied</h2>
          <button onClick={()=>supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <Admin user={session.user} profile={profile}/>;
}
function Admin({user,profile}){

const[tab,setTab]=useState('dashboard');
const[apps,setApps]=useState([]);
const[selected,setSelected]=useState(null);

async function load(){

const{data,error}=await supabase
.from('applications')
.select('*')
.order('created_at',{ascending:false});

if(error)
alert(error.message);
else
setApps(data||[]);

}

useEffect(()=>{
load();
},[]);

const counts={
total:apps.length,
received:apps.filter(x=>x.status==='received').length,
processing:apps.filter(x=>x.status==='processing').length,
completed:apps.filter(x=>x.status==='completed').length,
rejected:apps.filter(x=>x.status==='rejected').length
};

return <>
<header>
<b>JOY ONLINE SERVICES</b>
<button onClick={()=>supabase.auth.signOut()}>
Logout
</button>
</header>

<nav>
{[
['dashboard','Dashboard'],
['applications','Applications'],
['new','New Application']
].map(x=>
<button
className={tab===x[0]?'active':''}
onClick={()=>setTab(x[0])}
key={x[0]}>
{x[1]}
</button>
)}
</nav>

<main>

{tab==='dashboard'&&<>
<h2>Dashboard</h2>
<p>Welcome, {profile.full_name||'Admin'}</p>

<div className="stats">

{Object.entries({
Total:counts.total,
Received:counts.received,
Processing:counts.processing,
Completed:counts.completed,
Rejected:counts.rejected
}).map(([k,v])=>
<div className="stat" key={k}>
<small>{k}</small>
<strong>{v}</strong>
</div>
)}

</div>
</>}

{tab==='applications'&&
<Applications
apps={apps}
refresh={load}
select={setSelected}
/>
}

{tab==='new'&&
<New
userId={user.id}
done={async()=>{
await load();
setTab('applications');
}}
/>
}

</main>

{selected&&
<Drawer
app={selected}
close={()=>setSelected(null)}
refresh={load}
/>
}

</>;
}


function Applications({apps,refresh,select}){
  const [search,setSearch]=useState('');

  const filteredApps=apps.filter(a=>
    (a.customer_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (a.mobile||'').includes(search) ||
    (a.application_no||'').toLowerCase().includes(search.toLowerCase())
  );

  return <>
    <div className="row">
      <h2>Applications</h2>

      <input
        type="text"
        placeholder="Search customer, mobile or application no..."
        value={search}
        onChange={e=>setSearch(e.target.value)}
      />

      <button onClick={refresh}>Refresh</button>
    </div>

    <div className="card scroll">
      <table>

        <thead>
          <tr>
            <th>No.</th>
            <th>Customer</th>
            <th>Mobile</th>
            <th>Service</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {filteredApps.map(a=>
            <tr key={a.id}>

              <td onClick={()=>select(a)}>
                {a.application_no}
              </td>

              <td onClick={()=>select(a)}>
                {a.customer_name}
              </td>

              <td onClick={()=>select(a)}>
                {a.mobile}
              </td>

              <td onClick={()=>select(a)}>
                {a.service}
              </td>

              <td onClick={()=>select(a)}>
                ₹{((a.fee_paise||0)/100).toFixed(2)}
              </td>

              <td onClick={()=>select(a)}>
                ₹{((a.paid_paise||0)/100).toFixed(2)}
              </td>

              <td onClick={()=>select(a)}>
                ₹{(((a.fee_paise||0)-(a.paid_paise||0))/100).toFixed(2)}
              </td>

              <td onClick={()=>select(a)}>
                <span className={'status '+a.status}>
                  {a.status}
                </span>
              </td>

              <td>
                <button
                  onClick={async e=>{
                    e.stopPropagation();

                    if(!window.confirm('Delete this application?'))
                      return;

                    const {error}=await supabase
                      .from('applications')
                      .delete()
                      .eq('id',a.id);

                    if(error){
                      alert(error.message);
                    }else{
                      alert('Application deleted');
                      refresh();
                    }
                  }}
                >
                  🗑️ Delete
                </button>
              </td>

            </tr>
          )}

          {!filteredApps.length &&
            <tr>
              <td colSpan="9">
                No applications found.
              </td>
            </tr>
          }

        </tbody>
      </table>
    </div>
  </>;
}
function New({userId,done}){

const[f,setF]=useState({
customer_name:'',
mobile:'',
service:'',
address:'',
fee:''
});

const[busy,setBusy]=useState(false);

function ch(e){
setF({
...f,
[e.target.name]:e.target.value
});
}

async function save(e){

e.preventDefault();
setBusy(true);

const{error}=await supabase
.from('applications')
.insert({
customer_id:userId,
customer_name:f.customer_name,
mobile:f.mobile,
service:f.service,
address:f.address||null,
fee_paise:Math.round((Number(f.fee)||0)*100),
payment_status:'unpaid',
status:'received'
});

if(error){

alert(error.message);

}else{

alert('Application created');
await done();

}

setBusy(false);
}

const filteredApps=apps.filter(a=>
  (a.customer_name||'').toLowerCase().includes(search.toLowerCase()) ||
  (a.mobile||'').includes(search) ||
  (a.application_no||'').toLowerCase().includes(search.toLowerCase())
);
return <>
<h2>New Application</h2>

<form className="card form" onSubmit={save}>

{[
['customer_name','Customer name'],
['mobile','Mobile'],
['service','Service'],
['fee','Fee (₹)']
].map(x=>
<div key={x[0]}>
<label>{x[1]}</label>
<input
name={x[0]}
value={f[x[0]]}
onChange={ch}
required={x[0]!=='fee'}
/>
</div>
)}

<div className="full">
<label>Address</label>
<textarea
name="address"
value={f.address}
onChange={ch}
/>
</div>

<div className="full">

<button className="primary" disabled={busy}>
{busy?'Creating…':'Create Application'}
</button>

</div>

</form>
</>;
}


function Drawer({app,close,refresh}){

const[status,setStatus]=useState(app.status);
const[docs,setDocs]=useState([]);
const [documentType,setDocumentType]=useState('Other');
const[paid,setPaid]=useState((app.paid_paise||0)/100);
const[uploading,setUploading]=useState(false);
async function loadDocs(){

const{data}=await supabase
.from('documents')
.select('*')
.eq('application_id',app.id)
.order('created_at',{ascending:false});

setDocs(data||[]);

}

useEffect(()=>{
loadDocs();
},[app.id]);


async function save(){

const{error}=await supabase
.from('applications')
.update({
status,
paid_paise:Math.round((Number(paid)||0)*100),
updated_at:new Date().toISOString()
})
.eq('id',app.id);

if(error)
alert(error.message);
else{
alert('Status updated');
refresh();
}

}


async function upload(file, documentType){

if(!file)
return;

if(file.size>10*1024*1024)
return alert('File must be 10 MB or smaller.');

setUploading(true);

const safe=file.name.replace(
/[^a-zA-Z0-9._-]/g,
'_'
);

const path=
`${app.id}/${Date.now()}-${safe}`;

let r=await supabase.storage
.from(BUCKET)
.upload(path,file,{
contentType:file.type
});

if(r.error){

alert(r.error.message);

}else{

r=await supabase
.from('documents')
.insert({
  application_id:app.id,
  path,
  name:file.name,
  size:file.size,
  document_type:documentType
});

if(r.error)
alert(r.error.message);
else
await loadDocs();

}

setUploading(false);

}


async function view(d){

const{data,error}=await supabase.storage
.from(BUCKET)
.createSignedUrl(d.path,120);

if(error)
alert(error.message);
else
window.open(data.signedUrl,'_blank');

}


return <div className="backdrop" onClick={close}>

<aside onClick={e=>e.stopPropagation()}>

<div className="row">

<div>
<b>{app.application_no}</b>
<div>{app.customer_name}</div>
</div>

<button onClick={close}>✕</button>

</div>

<hr/>

<p>
<b>Mobile:</b> {app.mobile}
</p>

<button
  className="primary"
  onClick={()=>{
const phone=(app.mobile||'').replace(/\D/g,'');
    window.open(`https://wa.me/91${phone}`,'_blank');
  }}
>
  WhatsApp Customer
</button>

<p>
<b>Service:</b> {app.service}
</p>

<p>
<b>Payment:</b> {app.payment_status}
</p>
<p>
<b>Total Amount:</b> ₹{((app.fee_paise||0)/100).toFixed(2)}
</p>

<label>
<b>Paid Amount</b>
</label>

<input
type="number"
min="0"
step="0.01"
value={paid}
onChange={e=>setPaid(e.target.value)}
/>

<p>
<b>Balance:</b> ₹{(
((app.fee_paise||0)/100) - (Number(paid)||0)
).toFixed(2)}
</p>

<h3>Status</h3>

<div className="row">

<select
value={status}
onChange={e=>setStatus(e.target.value)}
>

<option>received</option>
<option>processing</option>
<option>completed</option>
<option>rejected</option>

</select>

<button className="primary" onClick={save}>
Save
</button>

</div>

<h3>Private Documents</h3>
  <label>Document Type</label>

<select
  value={documentType}
  onChange={(e)=>setDocumentType(e.target.value)}
>
  <option value="Aadhaar">Aadhaar</option>
  <option value="PAN">PAN</option>
  <option value="Voter ID">Voter ID</option>
  <option value="Photo">Photo</option>
  <option value="Signature">Signature</option>
  <option value="Other">Other</option>
</select>

<input
type="file"
accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
disabled={uploading}
onChange={e=>upload(e.target.files?.[0])}
/>

<p>
PDF/JPG/PNG, maximum 10 MB.
</p>

{docs.map(d=>
<div className="doc" key={d.id}>

<span>{d.name}</span>

<button onClick={()=>view(d)}>
View securely
</button>

</div>
)}

</aside>

</div>;
}


createRoot(
document.getElementById('root')
).render(<App/>);
