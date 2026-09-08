import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

const TABLE = 'blo_mobile_link_requests';
const STATUS_OPTIONS = ['Pending', 'Processing', 'Success', 'Failed'];

// This isolated adapter is intentionally unused until an authorized provider API
// and its documented request/response contract are supplied through the env var.
export async function callAuthorizedMobileLinkApi(payload) {
  const apiUrl = import.meta.env.VITE_BLO_MOBILE_LINK_API_URL;
  if (!apiUrl) return null;
  return fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

function decodeBase64(value) {
  const normalized = value.trim().replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function formatDecoded(value) {
  try { return { value: JSON.parse(value), isJson:true }; }
  catch { return { value, isJson:false }; }
}
function decodeAuthorizedResponse(input) {
  const raw = input.trim();
  if (!raw) throw new Error('Paste an authorized provider response to decode.');
  try { return { value:JSON.parse(raw), isJson:true }; } catch { /* try other supported formats */ }
  try {
    const urlDecoded = decodeURIComponent(raw.replace(/\+/g, ' '));
    if (urlDecoded !== raw) return formatDecoded(urlDecoded);
  } catch { /* continue */ }
  try { return formatDecoded(decodeBase64(raw)); }
  catch { throw new Error('Could not decode this as JSON, URL-encoded JSON, Base64 JSON, or Base64 text.'); }
}
function displayDate(value) { return value ? new Date(value).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : '—'; }

export default function BloMobileLink({ user }) {
  const [epicNo, setEpicNo] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [createdReference, setCreatedReference] = useState('');
  const [decoderInput, setDecoderInput] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState('');

  async function loadHistory() {
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending:false });
    if (error) setMessage(`Could not load mobile-link history: ${error.message}`);
    else setRecords(data || []);
  }
  useEffect(() => { loadHistory(); }, []);

  const filteredRecords = useMemo(() => records.filter((record) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [record.epic_no, record.mobile_no, record.reference_id]
      .some((value) => String(value || '').toLowerCase().includes(q));
    return matchesSearch && (filter === 'All' || record.status === filter);
  }), [records, search, filter]);

  async function submitRequest(event) {
    event.preventDefault();
    const cleanEpic = epicNo.trim();
    const cleanMobile = mobileNo.replace(/\D/g, '');
    setMessage(''); setCreatedReference('');
    if (!cleanEpic) { setMessage('Voter ID Number / EPIC No. is required.'); return; }
    if (!/^\d{10}$/.test(cleanMobile)) { setMessage('Mobile number must contain exactly 10 digits.'); return; }
    setBusy(true);
    const { data, error } = await supabase.from(TABLE)
      .insert({ epic_no:cleanEpic, mobile_no:cleanMobile, status:'Pending', created_by:user.id })
      .select('id, reference_id')
      .single();
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setEpicNo(''); setMobileNo('');
    setCreatedReference(data?.reference_id || 'Created successfully');
    setMessage('Mobile-link request saved as Pending.');
    await loadHistory();
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from(TABLE).update({ status }).eq('id', id);
    if (error) { setMessage(error.message); return; }
    setMessage('Request status updated.'); await loadHistory();
  }

  function decodeResponse() {
    setMessage('');
    if (!authorized) { setMessage('Confirm that you are authorized to process this response before decoding.'); return; }
    try { setDecoded(decodeAuthorizedResponse(decoderInput)); }
    catch (error) { setDecoded(null); setMessage(error.message); }
  }
  function clearDecoder() { setDecoderInput(''); setDecoded(null); setAuthorized(false); setSelectedRequest(''); }
  async function saveDecodedResponse() {
    if (!authorized || !decoded || !selectedRequest) { setMessage('Select a request, confirm authorization, and decode a response before saving.'); return; }
    const decodedData = decoded.isJson ? JSON.stringify(decoded.value) : String(decoded.value);
    const { error } = await supabase.from(TABLE).update({ provider_response:decoderInput, decoded_data:decodedData }).eq('id', selectedRequest);
    if (error) { setMessage(error.message); return; }
    setMessage('Authorized response data saved to the selected request.'); await loadHistory();
  }
  function printHistory() { window.print(); }

  return <section className="blo-mobile-link">
    <div className="blo-mobile-hero"><div><span className="blo-mobile-eyebrow">JOY ONLINE SERVICES · BLO</span><h3>Link Mobile No. to Voter ID</h3><p>Create authorized mobile-link requests. No third-party portal, OTP, or e-Sign workflow is accessed here.</p></div><div className="blo-mobile-shield">✓<span>AUTHORIZED<br/>WORKSPACE</span></div></div>
    {message && <div className="blo-message">{message}<button onClick={() => setMessage('')} aria-label="Dismiss">×</button></div>}
    <div className="blo-mobile-grid"><form className="blo-mobile-card" onSubmit={submitRequest}><h4>New Mobile Link Request</h4><p>Submit a request for authorized processing.</p><label>Voter ID Number / EPIC No.<input value={epicNo} onChange={(event) => setEpicNo(event.target.value)} placeholder="Enter EPIC number" autoComplete="off" /></label><label>Mobile No. to be Linked<input value={mobileNo} onChange={(event) => setMobileNo(event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="10-digit mobile number" autoComplete="off" /></label><button className="primary blo-mobile-submit" disabled={busy}>{busy ? 'Submitting…' : 'SUBMIT'}</button>{createdReference && <div className="blo-reference">Reference ID <strong>{createdReference}</strong></div>}</form><div className="blo-mobile-card blo-mobile-guidance"><h4>Request Safeguards</h4><ul><li>Requests are saved as <b>Pending</b>.</li><li>Only authorized staff can update a request status.</li><li>No OTP, e-Sign, scraping, or private voter lookup occurs in this workspace.</li></ul></div></div>
    <section className="blo-mobile-card blo-history"><div className="blo-title-row"><div><h4>Link History</h4><p>Search by EPIC, mobile number, or reference ID.</p></div><button onClick={printHistory}>Print / Save PDF</button></div><div className="blo-filters"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search EPIC, mobile, or reference ID…" /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></div><div className="scroll blo-table"><table><thead><tr><th>Sl. No.</th><th>Date &amp; Time</th><th>EPIC No.</th><th>Mobile No.</th><th>Ref. ID</th><th>Status</th><th>Status update</th></tr></thead><tbody>{filteredRecords.map((record, index) => <tr key={record.id}><td>{index + 1}</td><td>{displayDate(record.created_at)}</td><td>{record.epic_no}</td><td>{record.mobile_no}</td><td>{record.reference_id || '—'}</td><td><span className={`blo-link-status ${String(record.status || 'Pending').toLowerCase()}`}>{record.status || 'Pending'}</span></td><td><select aria-label={`Update status for ${record.reference_id || record.epic_no}`} value={record.status || 'Pending'} onChange={(event) => updateStatus(record.id, event.target.value)}>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}{!filteredRecords.length && <tr><td colSpan="7">No mobile-link requests found.</td></tr>}</tbody></table></div></section>
    <section className="blo-mobile-card blo-decoder"><div className="blo-title-row"><div><h4>Authorized Response Decoder</h4><p>Decoding runs locally in this browser. Paste only data you are authorized to process.</p></div><button onClick={printHistory}>Print / Save PDF</button></div><label className="blo-authorization"><input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} /> I confirm I am authorized to process this provider response.</label><textarea value={decoderInput} onChange={(event) => setDecoderInput(event.target.value)} placeholder="Paste JSON, URL-encoded JSON, Base64 JSON, or Base64 text" disabled={!authorized} /><div className="blo-actions"><button   type="button"   className="primary"   onClick={(event) => {     event.preventDefault();     decodeResponse();   }} >   Decode Response </button><button type="button" onClick={clearDecoder}>Clear</button></div>{decoded && <><label>Save to request<select value={selectedRequest} onChange={(event) => setSelectedRequest(event.target.value)}><option value="">Select a link request</option>{records.map((record) => <option key={record.id} value={record.id}>{record.reference_id || record.epic_no} — {record.epic_no}</option>)}</select></label><pre className="blo-decoded-output">{decoded.isJson ? JSON.stringify(decoded.value, null, 2) : String(decoded.value)}</pre><button className="primary" onClick={saveDecodedResponse}>Save Authorized Result</button></>}</section>
  </section>;
}
