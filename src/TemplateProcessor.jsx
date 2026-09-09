import React, { useMemo, useState } from 'react';

const EMPTY = {
  title: 'Document Template',
  reference: '',
  name: '',
  date: '',
  address: '',
  notes: ''
};

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c =>
    ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c])
  );
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
    };

    reader.readAsDataURL(file);
  }

  const previewStyle = useMemo(
    () =>
      template
        ? {
            backgroundImage: `url(${template})`
          }
        : {},
    [template]
  );

  function printDocument() {
    const photoHtml = photo
      ? `<img src="${photo}" style="width:110px;height:130px;object-fit:cover;border:1px solid #999"/>`
      : '';

    const background = template
      ? `background-image:url('${template}');background-size:100% 100%;background-repeat:no-repeat;`
      : '';

    const w = window.open('', '_blank', 'noopener,noreferrer');

    if (!w) {
      setMessage('Allow pop-ups to open the printable document.');
      return;
    }

    w.document.write(`
<!doctype html>
<html>
<head>
<title>${esc(data.title)}</title>

<style>

@page {
  size: A4;
  margin: 0;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
}

.page {
  width: 210mm;
  min-height: 297mm;
  box-sizing: border-box;
  padding: 22mm;
  ${background}
}

.box {
  background: rgba(255,255,255,.92);
  padding: 18px;
  border: 1px solid #bbb;
}

.head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.photo {
  width: 110px;
}

.field {
  margin: 10px 0;
}

.label {
  font-size: 12px;
  color: #555;
}

.value {
  font-size: 16px;
  font-weight: 600;
  white-space: pre-wrap;
}

.notice {
  margin-top: 20px;
  font-size: 11px;
  color: #8a1c1c;
  border: 1px solid #d9a5a5;
  padding: 8px;
}

</style>
</head>

<body>

<div class="page">

<div class="box">

<div class="head">

<div>

<h1>${esc(data.title)}</h1>

<div class="field">
<div class="label">Reference</div>
<div class="value">${esc(data.reference)}</div>
</div>

</div>

<div class="photo">
${photoHtml}
</div>

</div>

<div class="field">
<div class="label">Name</div>
<div class="value">${esc(data.name)}</div>
</div>

<div class="field">
<div class="label">Date</div>
<div class="value">${esc(data.date)}</div>
</div>

<div class="field">
<div class="label">Address</div>
<div class="value">${esc(data.address)}</div>
</div>

<div class="field">
<div class="label">Notes</div>
<div class="value">${esc(data.notes)}</div>
</div>

<div class="notice">
SAMPLE / DRAFT — NOT AN OFFICIAL GOVERNMENT ID OR CERTIFICATE
</div>

</div>

</div>

<script>
window.onload = () => window.print()
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
            Use only templates and information you are authorized to process.
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
            1. Template & Images
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
            Upload a blank/authorized template image.
            PNG, JPG or WebP, max 8 MB.
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
            Photo is placed automatically in the preview.
          </small>

          <h3>
            2. Fill Details
          </h3>

          {[
            ['title', 'Document Title'],
            ['reference', 'Reference Number'],
            ['name', 'Name'],
            ['date', 'Date']
          ].map(([key, label]) => (

            <label key={key}>

              {label}

              <input
                value={data[key]}
                onChange={e =>
                  setField(
                    key,
                    e.target.value
                  )
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
                setField(
                  'address',
                  e.target.value
                )
              }
            />

          </label>

          <label>

            Notes

            <textarea
              rows="3"
              value={data.notes}
              onChange={e =>
                setField(
                  'notes',
                  e.target.value
                )
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
                    {data.title || 'Document Template'}
                  </h1>

                  <div className="preview-ref">
                    {data.reference || 'Reference Number'}
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

              <div className="preview-field">

                <b>Name</b>

                <span>
                  {data.name || 'Enter name'}
                </span>

              </div>

              <div className="preview-field">

                <b>Date</b>

                <span>
                  {data.date || 'Enter date'}
                </span>

              </div>

              <div className="preview-field">

                <b>Address</b>

                <span>
                  {data.address || 'Enter address'}
                </span>

              </div>

              <div className="preview-field">

                <b>Notes</b>

                <span>
                  {data.notes || 'Enter notes'}
                </span>

              </div>

              <div className="sample-watermark">
                SAMPLE / DRAFT
              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
