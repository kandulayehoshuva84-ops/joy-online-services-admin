import React, { useMemo, useState } from 'react';

const EMPTY = {
  title: 'Sample Voter Information',
  reference: '',
  name: '',
  parentName: '',
  dob: '',
  age: '',
  gender: '',
  constituency: '',
  partNo: '',
  pollingStation: '',
  pollingDate: '',
  address: '',
  referenceDate: '',
  notes: ''
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

export default function TemplateProcessor({ onBack }) {
  const [data, setData] = useState(EMPTY);
  const [template, setTemplate] = useState('');
  const [photo, setPhoto] = useState('');
  const [message, setMessage] = useState('');

  function setField(key, value) {
    setData(current => ({
      ...current,
      [key]: value
    }));
  }

  function fileToDataUrl(file, setter, maxMb) {
    if (!file) return;

    if (file.size > maxMb * 1024 * 1024) {
      setMessage(`File must be ${maxMb} MB or smaller.`);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setter(String(reader.result || ''));
      setMessage('');
    };

    reader.onerror = () => {
      setMessage('Unable to read the selected file.');
    };

    reader.readAsDataURL(file);
  }

  const previewStyle = useMemo(
    () => template
      ? { backgroundImage: `url(${template})` }
      : {},
    [template]
  );

  function printDocument() {
    const photoHtml = photo
      ? `<img src="${photo}" class="photo" alt="Photo"/>`
      : `<div class="photo-placeholder">PHOTO</div>`;

    const background = template
      ? `background-image:url('${template}');`
      : '';

    const w = window.open('', '_blank');

    if (!w) {
      setMessage('Please allow pop-ups to open the PDF preview.');
      return;
    }

    w.document.write(`
<!doctype html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${esc(data.title)}</title>

<style>
@page {
  size: A4;
  margin: 0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #eee;
}

.page {
  width: 210mm;
  min-height: 297mm;
  padding: 14mm;
  ${background}
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
}

.card {
  background: rgba(255,255,255,.94);
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 18px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  border-bottom: 2px solid #172554;
  padding-bottom: 14px;
}

.title {
  font-size: 24px;
  font-weight: 800;
  color: #172554;
  margin-bottom: 8px;
}

.draft {
  display: inline-block;
  padding: 5px 9px;
  border: 1px solid #b45309;
  border-radius: 5px;
  color: #92400e;
  font-size: 10px;
  font-weight: 800;
}

.reference {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.photo {
  width: 100px;
  height: 120px;
  object-fit: cover;
  border: 1px solid #777;
}

.photo-placeholder {
  width: 100px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #999;
  color: #777;
  font-size: 12px;
}

.section {
  margin-top: 18px;
}

.section-title {
  font-size: 14px;
  font-weight: 800;
  color: #172554;
  border-bottom: 1px solid #dbe3ee;
  padding-bottom: 6px;
  margin-bottom: 8px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px 18px;
}

.field {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px;
  padding: 5px 0;
  font-size: 12px;
}

.label {
  color: #64748b;
  font-weight: 700;
}

.value {
  color: #111827;
  white-space: pre-wrap;
  word-break: break-word;
}

.full {
  grid-column: 1 / -1;
}

.notice {
  margin-top: 22px;
  padding: 10px;
  border: 1px solid #dcaaaa;
  background: #fff7f7;
  color: #8a1c1c;
  text-align: center;
  font-size: 11px;
  font-weight: 800;
}

.watermark {
  margin-top: 16px;
  text-align: center;
  color: #991b1b;
  font-size: 20px;
  font-weight: 900;
  opacity: .22;
  transform: rotate(-8deg);
}
</style>
</head>

<body>

<div class="page">

  <div class="card">

    <div class="header">

      <div>
        <div class="title">
          ${esc(data.title || 'Sample Voter Information')}
        </div>

        <div class="draft">
          SAMPLE / DRAFT
        </div>

        <div class="reference">
          Reference: ${esc(data.reference || '-')}
        </div>
      </div>

      ${photoHtml}

    </div>

    <div class="section">

      <div class="section-title">
        PERSONAL DETAILS
      </div>

      <div class="grid">

        <div class="field">
          <div class="label">Name</div>
          <div class="value">${esc(data.name || '-')}</div>
        </div>

        <div class="field">
          <div class="label">Parent / Guardian</div>
          <div class="value">${esc(data.parentName || '-')}</div>
        </div>

        <div class="field">
          <div class="label">DOB</div>
          <div class="value">${esc(data.dob || '-')}</div>
        </div>

        <div class="field">
          <div class="label">Age</div>
          <div class="value">${esc(data.age || '-')}</div>
        </div>

        <div class="field">
          <div class="label">Gender</div>
          <div class="value">${esc(data.gender || '-')}</div>
        </div>

      </div>

    </div>

    <div class="section">

      <div class="section-title">
        ELECTION / POLLING INFORMATION
      </div>

      <div class="grid">

        <div class="field">
          <div class="label">Constituency</div>
          <div class="value">${esc(data.constituency || '-')}</div>
        </div>

        <div class="field">
          <div class="label">Part No.</div>
          <div class="value">${esc(data.partNo || '-')}</div>
        </div>

        <div class="field full">
          <div class="label">Polling Station</div>
          <div class="value">${esc(data.pollingStation || '-')}</div>
        </div>

        <div class="field">
          <div class="label">Polling Date</div>
          <div class="value">${esc(data.pollingDate || '-')}</div>
        </div>

        <div class="field">
          <div class="label">Reference Date</div>
          <div class="value">${esc(data.referenceDate || '-')}</div>
        </div>

      </div>

    </div>

    <div class="section">

      <div class="section-title">
        ADDRESS
      </div>

      <div class="field">
        <div class="label">Address</div>
        <div class="value">${esc(data.address || '-')}</div>
      </div>

    </div>

    <div class="section">

      <div class="section-title">
        NOTES
      </div>

      <div class="value">
        ${esc(data.notes || '-')}
      </div>

    </div>

    <div class="notice">
      SAMPLE / DRAFT — NOT AN OFFICIAL GOVERNMENT ID OR CERTIFICATE
    </div>

    <div class="watermark">
      SAMPLE / DRAFT
    </div>

  </div>

</div>

<script>
window.onload = function () {
  window.print();
};
</script>

</body>
</html>
`);

    w.document.close();
  }

  function clearAll() {
    setData(EMPTY);
    setTemplate('');
    setPhoto('');
    setMessage('Cleared.');
  }

  const fields = [
    ['title', 'Document Title'],
    ['reference', 'Reference Number'],
    ['name', 'Name'],
    ['parentName', 'Parent / Guardian Name'],
    ['dob', 'Date of Birth'],
    ['age', 'Age'],
    ['gender', 'Gender'],
    ['constituency', 'Assembly Constituency'],
    ['partNo', 'Part Number'],
    ['pollingStation', 'Polling Station'],
    ['pollingDate', 'Polling Date'],
    ['referenceDate', 'Reference Date']
  ];

  return (
    <section className="template-processor">

      <div className="template-header">

        <div>

          <button
            className="back-service"
            onClick={onBack}
          >
            ← Back to BLO Panel
          </button>

          <h2>
            Document Template Processor
          </h2>

          <p>
            Create authorized sample / draft documents.
          </p>

        </div>

        <span className="template-badge">
          SAMPLE / DRAFT MODE
        </span>

      </div>

      {message && (
        <div className="blo-message">
          {message}

          <button
            onClick={() => setMessage('')}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="template-grid">

        <div className="card template-form-card">

          <h3>
            1. Template & Photo
          </h3>

          <label>
            Background Template Image

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={e =>
                fileToDataUrl(
                  e.target.files?.[0],
                  setTemplate,
                  8
                )
              }
            />
          </label>

          <small>
            Upload a blank / authorized template.
          </small>

          <label>
            Photo / Image

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={e =>
                fileToDataUrl(
                  e.target.files?.[0],
                  setPhoto,
                  5
                )
              }
            />
          </label>

          <small>
            Maximum photo size: 5 MB.
          </small>

          <h3>
            2. Fill Details
          </h3>

          {fields.map(([key, label]) => (
            <label key={key}>

              {label}

              <input
                value={data[key]}
                onChange={e =>
                  setField(key, e.target.value)
                }
              />

            </label>
          ))}

          <label>
            Address

            <textarea
              rows="3"
              value={data.address}
              onChange={e =>
                setField('address', e.target.value)
              }
            />
          </label>

          <label>
            Notes

            <textarea
              rows="3"
              value={data.notes}
              onChange={e =>
                setField('notes', e.target.value)
              }
            />
          </label>

          <div className="blo-actions">

            <button
              className="primary"
              onClick={printDocument}
            >
              Preview / Save PDF
            </button>

            <button
              onClick={clearAll}
            >
              Clear
            </button>

          </div>

        </div>

        <div className="template-preview-wrap">

          <div
            className="template-preview"
            style={previewStyle}
          >

            <div className="template-overlay">

              <div className="template-preview-top">

                <div>

                  <h1>
                    {data.title || 'Sample Voter Information'}
                  </h1>

                  <span className="template-badge">
                    SAMPLE / DRAFT
                  </span>

                  <div className="preview-ref">
                    Reference: {data.reference || '-'}
                  </div>

                </div>

                {photo ? (
                  <img
                    className="template-photo"
                    src={photo}
                    alt="Uploaded"
                  />
                ) : (
                  <div className="template-photo placeholder">
                    PHOTO
                  </div>
                )}

              </div>

              <div className="preview-section">

                <h3>PERSONAL DETAILS</h3>

                <div className="preview-grid">

                  <div>
                    <b>Name</b>
                    <span>{data.name || '-'}</span>
                  </div>

                  <div>
                    <b>Parent / Guardian</b>
                    <span>{data.parentName || '-'}</span>
                  </div>

                  <div>
                    <b>DOB</b>
                    <span>{data.dob || '-'}</span>
                  </div>

                  <div>
                    <b>Age</b>
                    <span>{data.age || '-'}</span>
                  </div>

                  <div>
                    <b>Gender</b>
                    <span>{data.gender || '-'}</span>
                  </div>

                </div>

              </div>

              <div className="preview-section">

                <h3>ELECTION / POLLING INFORMATION</h3>

                <div className="preview-grid">

                  <div>
                    <b>Constituency</b>
                    <span>{data.constituency || '-'}</span>
                  </div>

                  <div>
                    <b>Part No.</b>
                    <span>{data.partNo || '-'}</span>
                  </div>

                  <div>
                    <b>Polling Station</b>
                    <span>{data.pollingStation || '-'}</span>
                  </div>

                  <div>
                    <b>Polling Date</b>
                    <span>{data.pollingDate || '-'}</span>
                  </div>

                  <div>
                    <b>Reference Date</b>
                    <span>{data.referenceDate || '-'}</span>
                  </div>

                </div>

              </div>

              <div className="preview-section">

                <h3>ADDRESS</h3>

                <div className="preview-address">
                  {data.address || '-'}
                </div>

              </div>

              <div className="preview-section">

                <h3>NOTES</h3>

                <div className="preview-address">
                  {data.notes || '-'}
                </div>

              </div>

              <div className="sample-watermark">
                SAMPLE / DRAFT
              </div>

              <div className="sample-warning">
                SAMPLE / DRAFT — NOT AN OFFICIAL GOVERNMENT ID OR CERTIFICATE
              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
