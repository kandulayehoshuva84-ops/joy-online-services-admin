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
const [selectedService,setSelectedService]=useState(null);
const[apps,setApps]=useState([]);
const[selected,setSelected]=useState(null);
const[appointments,setAppointments]=useState([]);
const[appointment,setAppointment]=useState({
  customer_name:'',
  mobile:'',
  service:'',
  appointment_date:'',
  appointment_time:'',
  notes:''
});
const[appointmentBusy,setAppointmentBusy]=useState(false);

async function loadAppointments(){
  const{data,error}=await supabase
    .from('appointments')
    .select('*')
    .order('appointment_date',{ascending:true})
    .order('appointment_time',{ascending:true});

  if(error){
    alert(error.message);
  }else{
    setAppointments(data||[]);
  }
}

useEffect(()=>{
  loadAppointments();
},[]);
async function saveAppointment(){
  if(
    !appointment.customer_name ||
    !appointment.mobile ||
    !appointment.service ||
    !appointment.appointment_date ||
    !appointment.appointment_time
  ){
    alert('Please fill all required fields');
    return;
  }

  setAppointmentBusy(true);

  const { error } = await supabase
    .from('appointments')
    .insert([appointment]);

  setAppointmentBusy(false);

  if(error){
    alert(error.message);
    return;
  }

  alert('Appointment saved successfully!');

  setAppointment({
    customer_name:'',
    mobile:'',
    service:'',
    appointment_date:'',
    appointment_time:'',
    notes:''
  });

  await loadAppointments();
  setTab('appointments');
}  
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
const now=new Date();

const todayIncome=apps
  .filter(a=>{
    const d=new Date(a.created_at);
    return d.toDateString()===now.toDateString();
  })
  .reduce((sum,a)=>sum+(Number(a.paid_paise)||0),0)/100;

const monthIncome=apps
  .filter(a=>{
    const d=new Date(a.created_at);
    return d.getMonth()===now.getMonth() &&
           d.getFullYear()===now.getFullYear();
  })
  .reduce((sum,a)=>sum+(Number(a.paid_paise)||0),0)/100;

const totalPaid=apps
  .reduce((sum,a)=>sum+(Number(a.paid_paise)||0),0)/100;

const totalBalance=apps
  .reduce((sum,a)=>sum+
    ((Number(a.fee_paise)||0)-(Number(a.paid_paise)||0)),0)/100;

return <div className="app-shell">
<aside className="sidebar">
  <div className="brand">
    <div className="brand-mark">JOY</div>
    <div className="brand-sub">ONLINE SERVICES</div>
  </div>
  <nav>
  {[
    ['dashboard','⌂','Dashboard'],
    ['appointments','▣','Appointments'],
    ['applications','♙','Applications'],
    ['new','＋','New Application'],
    ['adharDictionary','▣','Adhar Dictionary']
  ].map(([id,icon,label])=>
    <button className={tab===id?'active':''} onClick={()=>setTab(id)} key={id}>
      <span className="nav-icon">{icon}</span><span>{label}</span>
    </button>
  )}
  </nav>
  <div className="system-status">
    <span className="status-dot"></span>
    <div><strong>System Online</strong><small>All services running smoothly</small></div>
  </div>
</aside>
<div className="app-content">
<header>
  <div className="mobile-brand">JOY ONLINE SERVICES</div>
  <div className="topbar-right">
    <div className="date-card">
      <span className="date-icon">▣</span>
      <div><small>Today</small><strong>{new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</strong></div>
    </div>
    <div className="admin-user">
      <span className="admin-avatar">{(profile.full_name||'A').charAt(0).toUpperCase()}</span>
      <strong>{'JOSHI JOY'}</strong>
      <button onClick={()=>supabase.auth.signOut()}>Logout</button>
    </div>
  </div>
</header>
<main>

{tab==='dashboard'&&<>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
  <h2>Dashboard</h2>
  <button onClick={load}>🔄 Refresh</button>
</div>
<p>
  {new Date().getHours() < 12
    ? 'Good Morning'
    : new Date().getHours() < 17
    ? 'Good Afternoon'
    : 'Good Evening'}
  , {'JOSHI JOY'} 👋
</p>
  
<div style={{marginBottom:'15px'}}>
  📅 Today: {new Date().toLocaleDateString('en-IN')}
</div>
  
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
<div className="stats">

<div className="stat">
<small>Today Applications</small>
<strong>
{apps.filter(a =>
  a.created_at &&
  new Date(a.created_at).toDateString() === new Date().toDateString()
).length}
</strong>
</div>

<div className="stat">
<small>Today Pending</small>
<strong>
{apps.filter(a =>
  a.created_at &&
  new Date(a.created_at).toDateString() === new Date().toDateString() &&
  (a.status === 'received' || a.status === 'processing')
).length}
</strong>
</div>

<div className="stat">
<small>Today Completed</small>
<strong>
{apps.filter(a =>
  a.created_at &&
  new Date(a.created_at).toDateString() === new Date().toDateString() &&
  a.status === 'completed'
).length}
</strong>
</div>

<div className="stat">
<small>Today Collection</small>
<strong>
₹{(
  apps
    .filter(a =>
      a.created_at &&
      new Date(a.created_at).toDateString() === new Date().toDateString()
    )
    .reduce((sum, a) => sum + (Number(a.paid_paise) || 0), 0) / 100
).toFixed(2)}
</strong>
</div>

</div>
<div className="stats">
  <div className="stat">
    <small>Today Income</small>
    <strong>₹{todayIncome.toFixed(2)}</strong>
  </div>

  <div className="stat">
    <small>Monthly Income</small>
    <strong>₹{monthIncome.toFixed(2)}</strong>
  </div>
  <div className="stat">
  <small>Total Paid</small>
  <strong>
    ₹{(apps.reduce((sum, a) => sum + (Number(a.paid_paise) || 0), 0) / 100).toFixed(2)}
  </strong>
</div>

<div className="stat">
  <small>Total Balance</small>
  <strong>
    ₹{(apps.reduce((sum, a) => sum + (Number(a.fee_paise) || 0), 0) / 100 -
        apps.reduce((sum, a) => sum + (Number(a.paid_paise) || 0), 0) / 100).toFixed(2)}
  </strong>
</div>
</div>

<section className="services-section">
{selectedService ? (
  <div className="service-detail">
    <button className="back-service" onClick={()=>setSelectedService(null)}>← Back to Services</button>
    <div className="service-detail-heading">
      <h2>{selectedService.name}</h2><p>Select a service to continue</p>
    </div>
    <div className="subservice-grid">
      {selectedService.subServices.map((service)=>(
        <div key={service.name} className="subservice-card"
          onClick={()=>window.open(service.url,'_blank','noopener,noreferrer')}>
          <div className="subservice-icon">→</div>
          <strong>{service.name}</strong>
          <span>Open Service</span>
        </div>
      ))}
    </div>
  </div>
) : (
  <>
    <div className="services-heading">
      <div>
        <div className="services-title"><span>▦</span> Our Services</div>
        <p>Click on any service to view options</p>
      </div>
      <div className="services-tag">FAST&nbsp; • &nbsp;SECURE&nbsp; • &nbsp;RELIABLE</div>
    </div>
    <div className="service-grid">
      {[
        {name:'Aadhaar Card',image:'/images/adhar-logo.webp',subServices:[
          {name:'Aadhaar Update',url:'https://myaadhaar.uidai.gov.in/'},
          {name:'Address Update',url:'https://myaadhaar.uidai.gov.in/'},
          {name:'Mobile Update',url:'https://myaadhaar.uidai.gov.in/'},
          {name:'Name Correction',url:'https://myaadhaar.uidai.gov.in/'},
          {name:'DOB Correction',url:'https://myaadhaar.uidai.gov.in/'},
          {name:'Download Aadhaar',url:'https://myaadhaar.uidai.gov.in/'}]},
        {name:'PAN Card',image:'/images/pan-card.webp',subServices:[
          {name:'New PAN Application',url:'https://panmitra.com/portallogin/login'},
          {name:'PAN Correction',url:'https://panmitra.com/portallogin/login'},
          {name:'PAN Download',url:'https://panmitra.com/portallogin/login'}]},
        {name:'Voter Card',image:'/images/voter-card.webp',subServices:[
          {name:'New Voter Registration',url:'https://voters.eci.gov.in/'},
          {name:'Voter Correction',url:'https://voters.eci.gov.in/'},
          {name:'Download e-EPIC',url:'https://voters.eci.gov.in/'}]},
        {name:'Driving Licence',image:'/images/driving-licence.webp',subServices:[
          {name:'Learner Licence',url:'https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do'},
          {name:'DL Renewal',url:'https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do'},
          {name:'DL Services',url:'https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do'}]}
      ].map((service)=>(
        <div key={service.name} className="service-card" onClick={()=>setSelectedService(service)}>
          <div className="service-image-wrap"><img src={service.image} alt={service.name}/></div>
          <strong>{service.name}</strong>
          <div className="service-hint">Click to View Services</div>
          <div className="service-arrow">→</div>
        </div>
      ))}
    </div>
  </>
)}
</section>

<div className="appointment-box">
<h3>📅 Appointments ({appointments.length})</h3>
  <p>Manage today's appointments</p>
<button onClick={() => setTab('appointments')}>
  View Appointments
  </button>
</div>

</>}

{tab==='applications'&&
<Applications
apps={apps}
refresh={load}
select={setSelected}
/>
}

{tab==='adharDictionary' && (
  <section className="adhar-book">
    <div className="adhar-book-head">
      <button onClick={()=>setTab('dashboard')}>← Back to Dashboard</button>
      <div>
        <h2>📖 Adhar Dictionary</h2>
        <p>Aadhaar problems &amp; practical solutions</p>
      </div>
    </div>

    <div className="adhar-book-layout">
      <aside className="adhar-book-index">
        <h3>Contents</h3>
        <button onClick={()=>document.getElementById('aadhaar-enrolment')?.scrollIntoView({behavior:'smooth'})}>1. Enrollment Problems</button>
        <button onClick={()=>document.getElementById('aadhaar-update')?.scrollIntoView({behavior:'smooth'})}>2. Update Problems</button>
        <button onClick={()=>document.getElementById('aadhaar-mobile')?.scrollIntoView({behavior:'smooth'})}>3. Mobile Problems</button>
        <button onClick={()=>document.getElementById('aadhaar-dob-name')?.scrollIntoView({behavior:'smooth'})}>4. Name / DOB Problems</button>
        <button onClick={()=>document.getElementById('aadhaar-address')?.scrollIntoView({behavior:'smooth'})}>5. Address Problems</button>
        <button onClick={()=>document.getElementById('aadhaar-download')?.scrollIntoView({behavior:'smooth'})}>6. Download / PVC</button>
        <button onClick={()=>document.getElementById('aadhaar-auth')?.scrollIntoView({behavior:'smooth'})}>7. OTP / Authentication</button>
        <button onClick={()=>document.getElementById('aadhaar-escalation')?.scrollIntoView({behavior:'smooth'})}>8. When to Escalate</button>
      </aside>

      <div className="adhar-book-pages">
        <div className="adhar-book-cover">
          <div className="book-icon">📕</div>
          <div>
            <h1>AADHAAR PROBLEM SOLVING</h1>
            <p>JOY ONLINE SERVICES — Adhar Dictionary</p>
            <span>Quick reference guide for common Aadhaar service issues</span>
          </div>
        </div>

        <article id="aadhaar-enrolment" className="adhar-book-section">
          <h3>1. Aadhaar Enrollment Problems</h3>
          <div className="solution-grid">
            <div><b>Enrollment not completed</b><p>Check whether the enrollment was successfully submitted. Keep the acknowledgement / EID safely for status checking.</p></div>
            <div><b>EID lost</b><p>Use the official UIDAI recovery/status options where available, or help the customer recover the enrolment details using the registered information.</p></div>
            <div><b>Enrollment rejected</b><p>Check the rejection reason first. Correct the required information or documents and follow the official re-enrollment process.</p></div>
          </div>
        </article>

        <article id="aadhaar-update" className="adhar-book-section">
          <h3>2. Aadhaar Update Problems</h3>
          <div className="solution-grid">
            <div><b>Update not reflecting</b><p>Check update status using the acknowledgement details. If it is still under process, wait for processing before submitting another request.</p></div>
            <div><b>Update rejected</b><p>Verify that the submitted information and supporting document match the requested update. Re-submit through an authorised UIDAI channel when required.</p></div>
            <div><b>Document not accepted</b><p>Use an accepted Proof of Identity / Proof of Address document as applicable and ensure the document is clear and valid.</p></div>
          </div>
        </article>

        <article id="aadhaar-mobile" className="adhar-book-section">
          <h3>3. Mobile Number Problems</h3>
          <div className="solution-grid">
            <div><b>Mobile number not linked</b><p>Aadhaar OTP services require a registered mobile number. If the number is not linked or needs changing, use the authorised Aadhaar update process.</p></div>
            <div><b>OTP not received</b><p>Check the registered mobile number, network, SMS availability and retry after a short interval. Never ask the customer to share an OTP with anyone.</p></div>
          </div>
        </article>

        <article id="aadhaar-dob-name" className="adhar-book-section">
          <h3>4. Name / Date of Birth Problems</h3>
          <div className="solution-grid">
            <div><b>Name correction</b><p>Verify the desired spelling against the supporting document and submit the correction through an authorised Aadhaar channel.</p></div>
            <div><b>Date of Birth correction</b><p>Check the supporting DOB document and eligibility for the requested correction before submitting.</p></div>
            <div><b>Mismatch in documents</b><p>First identify the exact mismatch. Use consistent information in the supporting document and application.</p></div>
          </div>
        </article>

        <article id="aadhaar-address" className="adhar-book-section">
          <h3>5. Address Problems</h3>
          <div className="solution-grid">
            <div><b>Address change</b><p>Use an accepted Proof of Address and enter the address carefully. Review spelling, PIN code and locality before submission.</p></div>
            <div><b>Address update rejected</b><p>Check whether the submitted address proof is acceptable and whether the address entered matches the supporting document.</p></div>
          </div>
        </article>

        <article id="aadhaar-download" className="adhar-book-section">
          <h3>6. Aadhaar Download / PVC Problems</h3>
          <div className="solution-grid">
            <div><b>e-Aadhaar download issue</b><p>Use the official UIDAI portal and verify the Aadhaar details / OTP requirements before downloading.</p></div>
            <div><b>PVC card issue</b><p>Check the official PVC order/status options and keep the request details for future reference.</p></div>
            <div><b>Aadhaar print needed</b><p>After a successful download, print only the required copy and handle the customer's Aadhaar information securely.</p></div>
          </div>
        </article>

        <article id="aadhaar-auth" className="adhar-book-section">
          <h3>7. OTP / Authentication Problems</h3>
          <div className="solution-grid">
            <div><b>Authentication failed</b><p>Check the entered Aadhaar details, OTP or biometric conditions and retry through the official service.</p></div>
            <div><b>Biometric authentication failed</b><p>Clean the fingers / scanner area and retry as appropriate. Repeated failures should be handled through the authorised Aadhaar support/update route.</p></div>
          </div>
        </article>

        <article id="aadhaar-escalation" className="adhar-book-section">
          <h3>8. When to Escalate</h3>
          <div className="adhar-warning">
            <b>Important:</b> Never guess, alter, or bypass UIDAI verification. For cases involving identity disputes, repeated rejection, locked/blocked access, or issues that cannot be resolved through the official process, guide the customer to the official UIDAI support / authorised centre.
          </div>
        </article>

        <div className="adhar-book-footer">
          <b>JOY ONLINE SERVICES</b>
          <span>AADHAAR PROBLEM SOLVING • TELUGU SAMASYA PARISHKARAM</span>
        </div>
      </div>
    </div>
  </section>
)}

{tab==='appointments' && (
  <div className="row">
    <h2>📅 Appointments</h2>

    <div className="card">
      <h3>Today's Appointments</h3>

{appointments.length === 0 ? (
  <p>No appointments added yet.</p>
) : (
  <div className="appointment-list">
    {appointments.map((a) => (
      <div className="card" key={a.id} style={{marginTop:'15px'}}>
        <h3>{a.customer_name}</h3>

        <p><b>Mobile:</b> {a.mobile}</p>
        <p><b>Service:</b> {a.service}</p>
        <p><b>Date:</b> {a.appointment_date}</p>
        <p><b>Time:</b> {a.appointment_time}</p>

        {a.notes && (
          <p><b>Notes:</b> {a.notes}</p>
        )}
      </div>
    ))}
  </div>
)}
      <button
  className="primary"
  onClick={() => setTab('newAppointment')}
>
  + New Appointment
</button>

      <button
        onClick={() => setTab('dashboard')}
      >
        Back to Dashboard
      </button>
    </div>
  </div>
)}
  {tab === 'newAppointment' && (
  <div className="row">
    <h2>📅 New Appointment</h2>

    <div className="card">
      <h3>Appointment Details</h3>

      <label>Customer Name</label>
      <input
  type="text"
  placeholder="Enter customer name"
  value={appointment.customer_name}
  onChange={e =>
    setAppointment({...appointment, customer_name:e.target.value})
  }
/>

      <label>Mobile Number</label>
      <input
  type="tel"
  placeholder="Enter mobile number"
  value={appointment.mobile}
  onChange={e =>
    setAppointment({...appointment, mobile:e.target.value})
  }
/>

      <label>Service</label>
      <input
  type="text"
  placeholder="Enter service"
  value={appointment.service}
  onChange={e =>
    setAppointment({...appointment, service:e.target.value})
  }
/>

      <label>Appointment Date</label>
<input
  type="date"
  value={appointment.appointment_date}
  onChange={e =>
    setAppointment({
      ...appointment,
      appointment_date: e.target.value
    })
  }
/>
      <label>Appointment Time</label>
<input
  type="time"
  value={appointment.appointment_time}
  onChange={e =>
    setAppointment({
      ...appointment,
      appointment_time: e.target.value
    })
  }
/>
      <label>Notes</label>
      <textarea
  rows="4"
  placeholder="Enter notes"
  value={appointment.notes}
  onChange={e =>
    setAppointment({
      ...appointment,
      notes: e.target.value
    })
  }
/>

      <br />

      <button
  className="primary"
  onClick={saveAppointment}
  disabled={appointmentBusy}
>
  {appointmentBusy ? 'Saving...' : 'Save Appointment'}
</button>

      <button onClick={() => setTab('appointments')}>
        Cancel
      </button>
    </div>
  </div>
)}
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

</div>
</div>;
}


function Applications({apps,refresh,select}){
  const [search,setSearch]=useState('');
  const [statusFilter,setStatusFilter]=useState('All');
  const [dateFilter,setDateFilter]=useState('All');
const [customDate,setCustomDate]=useState('');

  const filteredApps=apps.filter(a=>{
  const appDate=a.created_at ? new Date(a.created_at) : null;
  const today=new Date();

  const sameDay=(d1,d2)=>
    d1 && d2 && d1.toDateString()===d2.toDateString();

  const dateMatch =
    dateFilter==='All' ||
    (dateFilter==='Today' && sameDay(appDate,today)) ||
    (dateFilter==='Yesterday' &&
      sameDay(
        appDate,
        new Date(today.getFullYear(),today.getMonth(),today.getDate()-1)
      )
    ) ||
    (dateFilter==='This Month' &&
      appDate &&
      appDate.getMonth()===today.getMonth() &&
      appDate.getFullYear()===today.getFullYear()
    ) ||
    (dateFilter==='Custom' &&
      customDate &&
      appDate &&
      appDate.toISOString().slice(0,10)===customDate
    );

  return (
    (statusFilter==='All' || a.status===statusFilter) &&
    dateMatch &&
    (
      (a.customer_name||'').toLowerCase().includes(search.toLowerCase()) ||
      (a.mobile||'').includes(search) ||
      (a.application_no||'').toLowerCase().includes(search.toLowerCase())
    )
  );
});

  return <>
    <div className="row">
      <h2>Applications</h2>
      <div className="row">
  <button onClick={()=>setStatusFilter('All')}>All</button>
  <button onClick={()=>setStatusFilter('pending')}>Pending</button>
  <button onClick={()=>setStatusFilter('processing')}>Processing</button>
  <button onClick={()=>setStatusFilter('completed')}>Completed</button>
  <button onClick={()=>setStatusFilter('cancelled')}>Cancelled</button>
  <button onClick={()=>setDateFilter('All')}>All Dates</button>
<button onClick={()=>setDateFilter('Today')}>Today</button>
<button onClick={()=>setDateFilter('Yesterday')}>Yesterday</button>
<button onClick={()=>setDateFilter('This Month')}>This Month</button>
<button onClick={()=>setDateFilter('Custom')}>Custom Date</button>

{dateFilter==='Custom' && (
  <input
    type="date"
    value={customDate}
    onChange={e=>setCustomDate(e.target.value)}
  />
)}
</div>

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
application_no:'',
customer_name:'',
mobile:'',
service:'',
address:'',
notes:'',
fee:'',
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
application_no: f.application_no || `JOY-${Date.now().toString().slice(-6)}`,
customer_id:userId,
customer_name:f.customer_name,
mobile:f.mobile,
service:f.service,
address:f.address||null,
notes:f.notes||null,
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

return <>
<h2>New Application</h2>

<form className="card form" onSubmit={save}>

<div>
<label>Customer name</label>
<input
name="customer_name"
value={f.customer_name}
onChange={ch}
required
/>
</div>

<div>
<label>Mobile</label>
<input
name="mobile"
value={f.mobile}
onChange={ch}
required
/>
</div>

<div>
<label>Service</label>
<select
name="service"
value={f.service}
onChange={ch}
required
>
<option value="">Select Service</option>
<option value="Aadhaar Card">Aadhaar Card</option>
<option value="PAN Card">PAN Card</option>
<option value="Voter Card">Voter Card</option>
<option value="Passport">Passport</option>
<option value="Ration Card">Ration Card</option>
<option value="BIRTH CERTIFICATE CORRECTION">BIRTH CERTIFICATE CORRECTION</option>
<option value="AP STATE GAZZETTE">AP STATE GAZZETTE</option>
<option value="Others">Others</option>
</select>
</div>

<div>
<label>Fee (₹)</label>
<input
name="fee"
value={f.fee}
onChange={ch}
/>
</div>
<div className="full">
  <label>Important Notes</label>
  <textarea
    name="notes"
    rows="4"
    placeholder="Enter important notes"
    value={f.notes}
    onChange={ch}
  />
</div>
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
const[notes,setNotes]=useState(app.notes||'');
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
notes:notes||null,
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

const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
const path=`${app.id}/${Date.now()}-${safe}`;

let r=await supabase.storage
.from(BUCKET)
.upload(path,file,{contentType:file.type});

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
<aside className="application-modal" onClick={e=>e.stopPropagation()}>

<div className="modal-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"}}>
<div>
<b>{app.application_no}</b>
<div>{app.customer_name}</div>
</div>
<button onClick={close}>✕</button>
</div>

<div className="modal-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"18px",alignItems:"start"}}>

<section className="modal-panel application-details" style={{background:"#f8fafc",border:"1px solid #e5eaf2",borderRadius:"12px",padding:"20px"}}>
<h3>Application Details</h3>

<p style={{display:"grid",gridTemplateColumns:"170px 1fr",gap:"14px",margin:"0",padding:"7px 0"}}><b>Application No.</b><span>{app.application_no}</span></p>
<p style={{display:"grid",gridTemplateColumns:"170px 1fr",gap:"14px",margin:"0",padding:"7px 0"}}><b>Customer Name</b><span>{app.customer_name}</span></p>
<p style={{display:"grid",gridTemplateColumns:"170px 1fr",gap:"14px",margin:"0",padding:"7px 0"}}><b>Mobile</b><span>{app.mobile}</span></p>
<p style={{display:"grid",gridTemplateColumns:"170px 1fr",gap:"14px",margin:"0",padding:"7px 0"}}><b>Service</b><span>{app.service}</span></p>
<p style={{display:"grid",gridTemplateColumns:"170px 1fr",gap:"14px",margin:"0",padding:"7px 0"}}><b>Address</b><span>{app.address || 'Not provided'}</span></p>
<p style={{display:"grid",gridTemplateColumns:"170px 1fr",gap:"14px",margin:"0",padding:"7px 0"}}><b>Application Date</b><span>{app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN') : 'Not available'}</span></p>
<p style={{display:"grid",gridTemplateColumns:"170px 1fr",gap:"14px",margin:"0",padding:"7px 0"}}><b>Payment Status</b><span>{app.payment_status}</span></p>
<p style={{display:"grid",gridTemplateColumns:"170px 1fr",gap:"14px",margin:"0",padding:"7px 0"}}><b>Total Amount</b><span>₹{((app.fee_paise||0)/100).toFixed(2)}</span></p>

<div className="field-row">
<label><b>Paid Amount</b></label>
<input
type="number"
min="0"
step="0.01"
value={paid}
onChange={e=>setPaid(e.target.value)}
/>
</div>

<p style={{display:"grid",gridTemplateColumns:"170px 1fr",gap:"14px",margin:"0",padding:"7px 0"}}><b>Balance</b><span>₹{(
((app.fee_paise||0)/100) - (Number(paid)||0)
).toFixed(2)}</span></p>

<label><b>Status</b></label>
<select value={status} onChange={e=>setStatus(e.target.value)}>
<option>received</option>
<option>processing</option>
<option>completed</option>
<option>rejected</option>
</select>

<button className="primary save-button" onClick={save}>
Save
</button>
</section>

<section className="modal-right" style={{display:"flex",flexDirection:"column",gap:"16px",minWidth:0}}>

<div className="modal-actions" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
<button className="primary" onClick={()=>{
const phone=(app.mobile||'').replace(/\D/g,'');
window.open(`https://wa.me/91${phone}`,'_blank');
}}>
WhatsApp Customer
</button>

<button className="primary" onClick={() => window.print()}>
Print Receipt
</button>
</div>

<div className="modal-panel">
<h3>Private Documents</h3>
<label>Document Type</label>
<select value={documentType} onChange={e=>setDocumentType(e.target.value)}>
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
onChange={e=>upload(e.target.files?.[0],documentType)}
/>

<p>PDF/JPG/PNG, maximum 10 MB.</p>
</div>

<div className="modal-panel uploaded-panel">
<h3>Uploaded Documents</h3>
{docs.length===0&&<p>No documents uploaded.</p>}
{docs.map(d=>
<div className="doc" key={d.id}>
<span>{d.name}</span>
<button onClick={()=>view(d)}>View securely</button>
</div>
)}
</div>

<div className="modal-panel notes-panel">
<h3>Notes</h3>
<textarea
value={notes}
onChange={e=>setNotes(e.target.value)}
placeholder="Enter important notes"
rows="4"
/>
</div>

</section>
</div>
</aside>
</div>;
}

createRoot(
document.getElementById('root')
).render(<App/>);
 
