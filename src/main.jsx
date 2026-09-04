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
  , {profile.full_name || 'Admin'} 👋
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

<div style={{
  display:'grid',
  gridTemplateColumns:'repeat(4,minmax(0,1fr))',
  gap:'14px',
  margin:'22px 0'
}}>

{selectedService ? (
  <div style={{margin:'22px 0'}}>
    <button
      onClick={()=>setSelectedService(null)}
      style={{
        border:'none',
        background:'#111827',
        color:'#fff',
        padding:'10px 18px',
        borderRadius:'8px',
        cursor:'pointer',
        marginBottom:'18px',
        fontWeight:'600'
      }}
    >
      ← Back to Services
    </button>

    <h2 style={{
      margin:'0 0 18px',
      color:'#111827',
      fontSize:'22px'
    }}>
      {selectedService.name}
    </h2>

    <div style={{
      display:'grid',
      gridTemplateColumns:'repeat(3,minmax(0,1fr))',
      gap:'14px'
    }}>
      {selectedService.subServices.map((service)=>(
        <div
          key={service.name}
          className="card"
          onClick={()=>window.open(service.url,'_blank','noopener,noreferrer')}
          style={{
            cursor:'pointer',
            padding:'20px',
            textAlign:'center'
          }}
        >
          <div style={{
            fontSize:'17px',
            fontWeight:'700',
            color:'#14213d',
            marginBottom:'8px'
          }}>
            {service.name}
          </div>

          <div style={{
            fontSize:'13px',
            color:'#64748b'
          }}>
            Open Service →
          </div>
        </div>
      ))}
    </div>
  </div>
) : (
  <div style={{
    display:'grid',
    gridTemplateColumns:'repeat(4,minmax(0,1fr))',
    gap:'14px',
    margin:'22px 0'
  }}>
    {[
      {
        name:'Aadhaar Card',
        image:'/images/adhar-logo.webp',
        subServices:[
          {name:'Aadhaar Update',url:'https://myaadhaar.uidai.gov.in/'},
          {name:'Address Update',url:'https://myaadhaar.uidai.gov.in/'},
          {name:'Mobile Update',url:'https://myaadhaar.uidai.gov.in/'},
          {name:'Name Correction',url:'https://myaadhaar.uidai.gov.in/'},
          {name:'DOB Correction',url:'https://myaadhaar.uidai.gov.in/'},
          {name:'Download Aadhaar',url:'https://myaadhaar.uidai.gov.in/'}
        ]
      },
      {
        name:'PAN Card',
        image:'/images/pan-card.webp',
        subServices:[
          {name:'New PAN Application',url:'https://panmitra.com/portallogin/login'},
          {name:'PAN Correction',url:'https://panmitra.com/portallogin/login'},
          {name:'PAN Download',url:'https://panmitra.com/portallogin/login'}
        ]
      },
      {
        name:'Voter Card',
        image:'/images/voter-card.webp',
        subServices:[
          {name:'New Voter Registration',url:'https://voters.eci.gov.in/'},
          {name:'Voter Correction',url:'https://voters.eci.gov.in/'},
          {name:'Download e-EPIC',url:'https://voters.eci.gov.in/'}
        ]
      },
      {
        name:'Driving Licence',
        image:'/images/driving-licence.webp',
        subServices:[
          {name:'Learner Licence',url:'https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do'},
          {name:'DL Renewal',url:'https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do'},
          {name:'DL Services',url:'https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do'}
        ]
      }
    ].map((service)=>(
      <div
        key={service.name}
        className="card"
        onClick={()=>setSelectedService(service)}
        style={{
          textAlign:'center',
          cursor:'pointer',
          padding:'14px',
          overflow:'hidden'
        }}
      >
        <div style={{
          width:'100%',
          height:'150px',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          marginBottom:'12px'
        }}>
          <img
            src={service.image}
            alt={service.name}
            style={{
              maxWidth:'100%',
              maxHeight:'150px',
              objectFit:'contain',
              display:'block'
            }}
          />
        </div>

        <strong style={{
          fontSize:'16px',
          color:'#14213d'
        }}>
          {service.name}
        </strong>

        <div style={{
          marginTop:'7px',
          fontSize:'13px',
          color:'#64748b'
        }}>
          Click to View Services →
        </div>
      </div>
    ))}
  </div>
)}

</div>
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

</>;
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
            <th>Notes</th>
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
              {a.notes || '-'}
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

<button
  className="primary"
  onClick={() => window.print()}
>
  Print Receipt
</button>

<p>
<b>Service:</b> {app.service}
</p>

<p>
<b>Address:</b> {app.address || 'Not provided'}
</p>

<p>
<b>Application Date:</b> {app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN') : 'Not available'}
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
