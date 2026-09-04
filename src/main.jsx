*{box-sizing:border-box}

:root{
  --navy:#111827;
  --navy2:#1f2937;
  --page:#f1f3f6;
  --muted:#64748b;
  --border:#e5e7eb;
  --white:#fff;
  --accent:#2563eb;
}

html,body,#root{
  min-height:100%;
  margin:0;
}

body{
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:var(--page);
  color:#0f172a;
}

button,input,textarea,select{
  font:inherit;
}

button{
  border:0;
  border-radius:10px;
  padding:10px 14px;
  background:#e5e7eb;
  color:#111827;
  cursor:pointer;
  transition:.15s ease;
}

button:hover{
  filter:brightness(.97);
  transform:translateY(-1px);
}

button:disabled{
  opacity:.65;
  cursor:not-allowed;
  transform:none;
}

button.primary{
  background:var(--navy);
  color:white;
}

.center{
  min-height:100vh;
  display:grid;
  place-items:center;
}

.login{
  min-height:100vh;
  display:grid;
  place-items:center;
  padding:20px;
  background:var(--navy);
}

.loginbox{
  background:white;
  padding:30px;
  border-radius:20px;
  width:min(420px,100%);
  box-shadow:0 18px 50px #00000026;
}

.logo{
  width:55px;
  height:55px;
  background:var(--navy);
  color:white;
  border-radius:15px;
  display:grid;
  place-items:center;
  font-size:28px;
  font-weight:800;
}

.loginbox h1{
  font-size:22px;
  margin:16px 0 6px;
}

.loginbox p{
  color:var(--muted);
}

.loginbox label,
.form label{
  display:block;
  font-weight:700;
  font-size:13px;
  margin:12px 0 5px;
}

.loginbox input,
.form input,
.form textarea,
select{
  width:100%;
  padding:11px;
  border:1px solid #d1d5db;
  border-radius:10px;
  background:white;
  outline:none;
}

.loginbox input:focus,
.form input:focus,
.form textarea:focus,
select:focus{
  border-color:#94a3b8;
  box-shadow:0 0 0 3px #64748b18;
}

.loginbox button{
  width:100%;
  margin-top:16px;
}

.err{
  background:#fee2e2;
  color:#991b1b;
  padding:10px;
  border-radius:9px;
  margin-top:10px;
}

.success{
  background:#dcfce7;
  color:#166534;
  padding:10px;
  border-radius:9px;
  margin-top:10px;
}

.linkbutton{
  background:transparent;
  color:#2563eb;
  padding:8px;
}

.secondary{
  background:#eef0f3;
}

header{
  background:var(--navy);
  color:white;
  padding:17px 22px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  min-height:64px;
}

header b{
  font-size:18px;
  letter-spacing:.1px;
}

header button{
  background:#374151;
  color:white;
}

nav{
  background:white;
  border-bottom:1px solid #dfe3e8;
  padding:9px 12px;
  display:flex;
  gap:7px;
  overflow:auto;
}

nav button{
  white-space:nowrap;
  background:#e7e9ed;
  padding:11px 16px;
}

nav button.active{
  background:var(--navy);
  color:white;
}

main{
  max-width:1168px;
  margin:auto;
  padding:30px 24px 45px;
}

main h2{
  font-size:28px;
  margin:8px 0 24px;
  color:#14213d;
}

main h3{
  color:#14213d;
}

main p{
  color:#17304f;
}

.row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
}

.stats{
  display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));
  gap:12px;
  margin:0 0 12px;
}

.stat,
.card{
  background:var(--white);
  border-radius:16px;
  padding:17px;
  box-shadow:0 4px 18px #0f172a0d;
  border:1px solid #eef0f3;
}

.stat{
  min-height:96px;
}

.stat small{
  display:block;
  color:#64748b;
  font-size:14px;
  margin-bottom:4px;
}

.stat strong{
  font-size:30px;
  line-height:1.1;
  color:#111827;
}

.appointment-box{
  background:white;
  border-radius:16px;
  padding:20px;
  margin-top:18px;
  box-shadow:0 4px 18px #0f172a0d;
  border:1px solid #eef0f3;
}

.appointment-box h3{
  margin:0 0 8px;
}

.appointment-box p{
  margin:0 0 14px;
  color:#64748b;
}

.scroll{
  overflow:auto;
  margin-top:12px;
}

table{
  width:100%;
  min-width:700px;
  border-collapse:collapse;
  background:white;
}

th,td{
  padding:13px;
  border-bottom:1px solid #eef0f3;
  text-align:left;
  white-space:nowrap;
}

th{
  color:#64748b;
  font-size:13px;
  background:#f8fafc;
}

tr{
  cursor:pointer;
}

.status{
  padding:5px 9px;
  border-radius:999px;
  font-size:12px;
  font-weight:700;
  text-transform:capitalize;
}

.received{
  background:#dbeafe;
  color:#1d4ed8;
}

.processing{
  background:#fef3c7;
  color:#92400e;
}

.completed{
  background:#dcfce7;
  color:#166534;
}

.rejected{
  background:#fee2e2;
  color:#991b1b;
}

.pending{
  background:#fef3c7;
  color:#92400e;
}

.cancelled{
  background:#fee2e2;
  color:#991b1b;
}

.form{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px 14px;
}

.full{
  grid-column:1/-1;
}

.backdrop{
  position:fixed;
  inset:0;
  background:#0008;
  z-index:20;
}

.backdrop aside{
  background:white;
  position:absolute;
  right:0;
  top:0;
  height:100%;
  width:min(560px,100%);
  padding:20px;
  overflow:auto;
  box-shadow:-10px 0 35px #0002;
}

.doc{
  display:flex;
  justify-content:space-between;
  gap:8px;
  border:1px solid #ddd;
  padding:10px;
  border-radius:9px;
  margin-top:8px;
}

.doc span{
  overflow:hidden;
  text-overflow:ellipsis;
}

@media(max-width:900px){
  .stats{
    grid-template-columns:repeat(3,1fr);
  }
}

@media(max-width:700px){
  header{
    padding:15px;
  }

  header b{
    font-size:16px;
  }

  main{
    padding:20px 12px 35px;
  }

  main h2{
    font-size:24px;
  }

  .stats{
    grid-template-columns:1fr 1fr;
  }

  .form{
    grid-template-columns:1fr;
  }

  .full{
    grid-column:auto;
  }
}

@media(max-width:420px){
  .stats{
    grid-template-columns:1fr;
  }

  .stat{
    min-height:auto;
  }
}
