import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

const BUCKET = 'Documents';
const EMPTY_VOTER = {
  epic_no:'', name:'', name_local:'', age:'', gender:'', mobile:'', relation_type:'Father',
  relation_name:'', relation_name_local:'', tahsil:'', district:'', house_no:'',
  assembly_constituency:'', assembly_constituency_local:'', part_no:'', part_name:'',
  part_name_local:'', language:'Telugu', address:'', address_local:'', application_type:'New Registration', status:'Pending'
};
const APPLICATION_TYPES = ['New Registration','Correction','Deletion','Address Change'];
const STATUSES = ['Pending','Approved','Rejected','Completed'];

function value(v) { return v ?? ''; }

export default function BloPanel({ user, onBack }) {
  const [section, setSection] = useState('original');
  const [voters, setVoters] = useState([]);
  const [visits, setVisits] = useState([]);
  const [voter, setVoter] = useState(EMPTY_VOTER);
  const [visit, setVisit] = useState({ visit_date:'', epic_no:'', voter_name:'', location:'', purpose:'', notes:'', status:'Pending' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function loadVoters() {
    const { data, error } = await supabase.from('blo_voters').select('*').order('created_at', { ascending:false });
    if (error) setMessage(`Could not load voter records: ${error.message}`);
    else setVoters(data || []);
  }
  async function loadVisits() {
    const { data, error } = await supabase.from('blo_field_visits').select('*').order('visit_date', { ascending:false });
    if (error) setMessage(`Could not load field visits: ${error.message}`);
    else setVisits(data || []);
  }
  useEffect(() => { loadVoters(); loadVisits(); }, []);

  const filtered = useMemo(() => voters.filter((item) => {
    const q = search.trim().toLowerCase();
    const matches = !q || [item.epic_no,item.name,item.mobile,item.part_no,item.district].some((x) => value(x).toLowerCase().includes(q));
    return matches && (statusFilter === 'All' || item.status === statusFilter);
  }), [voters, search, statusFilter]);

  function setField(field, fieldValue) { setVoter((current) => ({ ...current, [field]:fieldValue })); }
  function setVisitField(field, fieldValue) { setVisit((current) => ({ ...current, [field]:fieldValue })); }
  function edit(item) {
    setEditingId(item.id);
    setVoter({ ...EMPTY_VOTER, ...item, age:value(item.age) });
    setSection('original');
    window.scrollTo({ top:0, behavior:'smooth' });
  }
  function newApplication(type) {
    setEditingId(null);
    setVoter({ ...EMPTY_VOTER, application_type:type });
    setSection('original');
  }
  async function saveVoter() {
    if (!voter.epic_no || !voter.name || !voter.age || !voter.gender || !voter.part_no || !voter.district) {
      setMessage('EPIC No., name, age, gender, part number and district are required.'); return;
    }
    setBusy(true); setMessage('');
    const payload = { ...voter, age:Number(voter.age), updated_by:user.id };
    const request = editingId
      ? supabase.from('blo_voters').update(payload).eq('id', editingId)
      : supabase.from('blo_voters').insert({ ...payload, created_by:user.id });
    const { error } = await request;
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setMessage(editingId ? 'Voter record updated.' : 'Voter record saved.');
    setEditingId(null); setVoter(EMPTY_VOTER); await loadVoters(); setSection('list');
  }
  async function saveVisit() {
    if (!visit.visit_date || !visit.epic_no || !visit.voter_name || !visit.location || !visit.purpose) {
      setMessage('Complete all required field visit details.'); return;
    }
    setBusy(true); setMessage('');
    const { error } = await supabase.from('blo_field_visits').insert({ ...visit, created_by:user.id });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setMessage('Field visit report saved.'); setVisit({ visit_date:'', epic_no:'', voter_name:'', location:'', purpose:'', notes:'', status:'Pending' }); await loadVisits();
  }
  async function uploadPhoto(file) {
    if (!file || !editingId) { setMessage('Save the voter record before uploading a photo.'); return; }
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) { setMessage('Choose an image under 5 MB.'); return; }
    setBusy(true); setMessage('');
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `blo/${user.id}/${editingId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType:file.type, upsert:false });
    if (uploadError) { setBusy(false); setMessage(uploadError.message); return; }
    const { error: recordError } = await supabase.from('blo_voters').update({ photo_path:path, updated_by:user.id }).eq('id', editingId);
    setBusy(false);
    if (recordError) { setMessage(recordError.message); return; }
    setMessage('Photo stored in the private document bucket.'); await loadVoters();
  }
  function printRecord(item) {
    const details = Object.entries(item).filter(([key, val]) => val && !['id','created_at','updated_at','created_by','updated_by','photo_path'].includes(key));
    const safe = (text) => String(text).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) { setMessage('Allow pop-ups to print this voter record.'); return; }
    w.document.write(`<html><head><title>Voter record - ${safe(item.epic_no)}</title><style>body{font-family:Arial;padding:30px;color:#14213d}h1{color:#17439b}table{border-collapse:collapse;width:100%}td{border:1px solid #dbe4f0;padding:9px}td:first-child{font-weight:bold;width:35%}</style></head><body><h1>JOY ONLINE SERVICES — BLO Voter Record</h1><p>Official internal record. Handle securely.</p><table>${details.map(([key,val]) => `<tr><td>${safe(key.replaceAll('_',' '))}</td><td>${safe(val)}</td></tr>`).join('')}</table><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  }
  const nav = [
    ['original','Voter Original'], ['search','Voter Search'], ['registration','New Voter Registration'], ['correction','Voter Correction'], ['deletion','Voter Deletion'], ['address','Address Change'], ['list','Voter List'], ['visit','Field Visit Report'], ['photo','Voter Photo Upload'], ['translator','Local Language / Translator'], ['print','Voter Details Print / PDF'], ['status','Pending / Approved / Rejected'], ['notices','BLO Notices'], ['profile','BLO Profile']
  ];
  const formTitle = editingId ? 'Edit Voter Record' : voter.application_type;
  return <section className="blo-panel">
    <div className="blo-header"><div><button className="back-service" onClick={onBack}>← Back to Services</button><h2>BLO Management Panel</h2><p>Authorized, manual voter data management only. This panel does not access third-party voter data.</p></div><a className="eci-button" href="https://voters.eci.gov.in/" target="_blank" rel="noreferrer">Official ECI Portal ↗</a></div>
    <div className="blo-layout"><aside className="blo-menu">{nav.map(([id,label]) => <button key={id} className={section===id?'active':''} onClick={() => { if (id==='registration') newApplication('New Registration'); else if(id==='correction') newApplication('Correction'); else if(id==='deletion') newApplication('Deletion'); else if(id==='address') newApplication('Address Change'); else setSection(id); }}>{label}</button>)}</aside>
    <div className="blo-content">{message && <div className="blo-message">{message}<button onClick={() => setMessage('')} aria-label="Dismiss">×</button></div>}
      {(section==='original' || ['registration','correction','deletion','address'].includes(section)) && <VoterForm voter={voter} setField={setField} title={formTitle} busy={busy} editingId={editingId} onSave={saveVoter} onSearch={() => setSection('search')} onPrint={() => editingId && printRecord(voters.find((x) => x.id===editingId) || voter)} onTranslator={() => setSection('translator')} onPhoto={uploadPhoto} />}
      {section==='search' && <SearchAndList title="Voter Search" items={filtered} search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onEdit={edit} onPrint={printRecord} />}
      {section==='list' && <SearchAndList title="Voter List" items={filtered} search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onEdit={edit} onPrint={printRecord} />}
      {section==='status' && <SearchAndList title="Application Status" items={filtered} search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onEdit={edit} onPrint={printRecord} />}
      {section==='visit' && <FieldVisit visit={visit} setField={setVisitField} busy={busy} onSave={saveVisit} visits={visits} />}
      {section==='photo' && <PhotoUpload editingId={editingId} voter={voter} onFile={uploadPhoto} busy={busy} />}
      {section==='translator' && <Translator voter={voter} setField={setField} />}
      {section==='print' && <PrintSection items={voters} onPrint={printRecord} />}
      {section==='notices' && <Notices />}
      {section==='profile' && <Profile />}
    </div></div>
  </section>;
}

function VoterForm({ voter, setField, title, busy, editingId, onSave, onSearch, onPrint, onTranslator, onPhoto }) { const fields = [['epic_no','EPIC No.'],['name','Name'],['name_local','Name in Local Language'],['age','Age'],['mobile','Mobile (if available)'],['relation_name','Father/Husband Name'],['relation_name_local','Father/Husband Name (Local Language)'],['tahsil','Tahsil'],['district','District'],['house_no','House No.'],['assembly_constituency','Assembly Constituency Number and Name'],['assembly_constituency_local','Assembly Constituency Number and Name (Local)'],['part_no','Part Number'],['part_name','Part Name'],['part_name_local','Part Name (Local Language)']]; return <div><div className="blo-title-row"><div><h3>{title}</h3><p>Enter records only from authorized documents or approved manual sources.</p></div><span className="blo-status">{editingId ? 'Editing saved record' : 'New record'}</span></div><div className="blo-form">{fields.map(([id,label]) => <label key={id}>{label}<input type={id==='age'?'number':'text'} value={value(voter[id])} onChange={(e)=>setField(id,e.target.value)} /></label>)}<label>Gender<select value={voter.gender} onChange={(e)=>setField('gender',e.target.value)}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></label><label>Father/Husband<select value={voter.relation_type} onChange={(e)=>setField('relation_type',e.target.value)}><option>Father</option><option>Husband</option></select></label><label>Photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>onPhoto(e.target.files?.[0])} disabled={!editingId||busy} /><small>{editingId?'Private upload: PNG, JPEG or WebP, max 5 MB.':'Save the record before adding a private photo.'}</small></label><label>Select Language<select value={voter.language} onChange={(e)=>setField('language',e.target.value)}><option>Telugu</option><option>Hindi</option><option>English</option><option>Urdu</option><option>Other</option></select></label><label>Application Type<select value={voter.application_type} onChange={(e)=>setField('application_type',e.target.value)}>{APPLICATION_TYPES.map((x)=><option key={x}>{x}</option>)}</select></label><label>Status<select value={voter.status} onChange={(e)=>setField('status',e.target.value)}>{STATUSES.map((x)=><option key={x}>{x}</option>)}</select></label><label className="full">Address<textarea value={voter.address} onChange={(e)=>setField('address',e.target.value)} /></label><label className="full">Address (Local Language)<textarea value={voter.address_local} onChange={(e)=>setField('address_local',e.target.value)} /></label></div><div className="blo-actions"><button className="primary" onClick={onSave} disabled={busy}>{busy?'Saving…':'Submit'}</button><button onClick={onSave} disabled={busy}>Save</button><button onClick={onSearch}>Search</button><button onClick={onPrint} disabled={!editingId}>Print</button><button onClick={onPrint} disabled={!editingId}>PDF</button><button onClick={onTranslator}>Language Translator</button></div></div>; }
function SearchAndList({ title, items, search, setSearch, statusFilter, setStatusFilter, onEdit, onPrint }) { return <div><div className="blo-title-row"><div><h3>{title}</h3><p>Search by EPIC No., name, mobile, part no. or district.</p></div></div><div className="blo-filters"><input placeholder="Search voter records…" value={search} onChange={(e)=>setSearch(e.target.value)} /><select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}><option>All</option>{STATUSES.map((x)=><option key={x}>{x}</option>)}</select></div><div className="scroll blo-table"><table><thead><tr><th>EPIC No.</th><th>Name</th><th>Age</th><th>Gender</th><th>Part No.</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((item)=><tr key={item.id}><td>{item.epic_no}</td><td>{item.name}</td><td>{item.age}</td><td>{item.gender}</td><td>{item.part_no}</td><td>{item.address}</td><td><span className={`status ${value(item.status).toLowerCase()}`}>{item.status}</span></td><td><button onClick={()=>onEdit(item)}>Edit</button><button onClick={()=>onPrint(item)}>Print / PDF</button></td></tr>)}{!items.length&&<tr><td colSpan="8">No voter records found.</td></tr>}</tbody></table></div></div>; }
function FieldVisit({ visit, setField, busy, onSave, visits }) { return <div><h3>Field Visit Report</h3><div className="blo-form">{[['visit_date','Visit Date','date'],['epic_no','EPIC No.'],['voter_name','Voter Name'],['location','Location'],['purpose','Purpose']].map(([id,label,type])=><label key={id}>{label}<input type={type||'text'} value={visit[id]} onChange={(e)=>setField(id,e.target.value)} /></label>)}<label>Status<select value={visit.status} onChange={(e)=>setField('status',e.target.value)}>{STATUSES.map((x)=><option key={x}>{x}</option>)}</select></label><label className="full">Notes<textarea value={visit.notes} onChange={(e)=>setField('notes',e.target.value)} /></label></div><div className="blo-actions"><button className="primary" onClick={onSave} disabled={busy}>{busy?'Saving…':'Save Field Visit Report'}</button></div><h4>Saved Visits</h4><div className="scroll blo-table"><table><thead><tr><th>Date</th><th>EPIC</th><th>Voter</th><th>Location</th><th>Purpose</th><th>Status</th></tr></thead><tbody>{visits.map((item)=><tr key={item.id}><td>{item.visit_date}</td><td>{item.epic_no}</td><td>{item.voter_name}</td><td>{item.location}</td><td>{item.purpose}</td><td>{item.status}</td></tr>)}</tbody></table></div></div>; }
function PhotoUpload({ editingId, voter, onFile, busy }) { return <div><h3>Voter Photo Upload</h3><p className="blo-note">Photos are uploaded to the existing private Supabase Documents bucket. No public photo URL is created.</p>{editingId ? <><p><b>Voter:</b> {voter.name} ({voter.epic_no})</p><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>onFile(e.target.files?.[0])} disabled={busy} /><p className="blo-note">PNG, JPEG or WebP only; maximum 5 MB.</p></> : <div className="blo-empty">Choose Edit from Voter List, save the voter record, then return here to attach a photo.</div>}</div>; }
function Translator({ voter, setField }) { return <div><h3>Local Language / Translator</h3><p className="blo-note">Use this workspace for authorized manual local-language entry. It intentionally does not send voter details to an external translation service.</p><div className="blo-form"><label>Select Language<select value={voter.language} onChange={(e)=>setField('language',e.target.value)}><option>Telugu</option><option>Hindi</option><option>English</option><option>Urdu</option><option>Other</option></select></label><label>Name in Local Language<input value={voter.name_local} onChange={(e)=>setField('name_local',e.target.value)} /></label><label>Father/Husband Name (Local Language)<input value={voter.relation_name_local} onChange={(e)=>setField('relation_name_local',e.target.value)} /></label><label>Constituency (Local)<input value={voter.assembly_constituency_local} onChange={(e)=>setField('assembly_constituency_local',e.target.value)} /></label><label>Part Name (Local Language)<input value={voter.part_name_local} onChange={(e)=>setField('part_name_local',e.target.value)} /></label><label className="full">Address (Local Language)<textarea value={voter.address_local} onChange={(e)=>setField('address_local',e.target.value)} /></label></div></div>; }
function PrintSection({ items, onPrint }) { return <div><h3>Voter Details Print / PDF</h3><p>Select a voter record below. The browser print dialog lets authorized staff print or save a PDF.</p><div className="scroll blo-table"><table><thead><tr><th>EPIC No.</th><th>Name</th><th>Part No.</th><th>Status</th><th>Action</th></tr></thead><tbody>{items.map((item)=><tr key={item.id}><td>{item.epic_no}</td><td>{item.name}</td><td>{item.part_no}</td><td>{item.status}</td><td><button onClick={()=>onPrint(item)}>Print / PDF</button></td></tr>)}</tbody></table></div></div>; }
function Notices() { return <div><h3>BLO Notices</h3><div className="blo-notices"><div><b>Data handling</b><p>Enter and access voter information only when authorized. Do not scrape, bypass, or copy data from third-party voter portals.</p></div><div><b>Official services</b><p>Use the Official ECI Portal button for authorized official workflows and verification.</p></div><div><b>Photo privacy</b><p>Voter photos remain in the private storage bucket and must not be shared using public links.</p></div></div></div>; }
function Profile() { return <div><h3>BLO Profile</h3><div className="blo-profile"><div className="blo-profile-avatar">JJ</div><div><h4>JOSHI JOY</h4><p>BLO / Authorized Admin</p><span>JOY ONLINE SERVICES</span></div></div></div>; }
