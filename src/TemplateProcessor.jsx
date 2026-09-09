.template-processor {
  width: 100%;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.template-badge {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  background: #fff3cd;
  color: #7a5b00;
}

.template-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
  align-items: start;
}

.template-form-card {
  padding: 20px;
}

.template-form-card label {
  display: block;
  margin: 12px 0;
  font-weight: 600;
}

.template-form-card input,
.template-form-card textarea {
  width: 100%;
  box-sizing: border-box;
  margin-top: 6px;
}

.template-form-card small {
  display: block;
  color: #667085;
  margin-bottom: 12px;
}

.template-preview-wrap {
  overflow: auto;
  background: #e9eef5;
  padding: 20px;
  border-radius: 14px;
}

.template-preview {
  width: 210mm;
  min-height: 297mm;
  margin: auto;
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  background-color: white;
  box-shadow: 0 4px 20px rgba(0,0,0,.12);
}

.template-overlay {
  min-height: 297mm;
  box-sizing: border-box;
  padding: 30mm 22mm;
  background: rgba(255,255,255,.88);
}

.template-preview-top {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.template-preview-top h1 {
  margin-top: 0;
}

.template-photo {
  width: 110px;
  height: 130px;
  object-fit: cover;
  border: 1px solid #999;
}

.template-photo.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee;
  color: #777;
}

.preview-ref {
  color: #667085;
}

.preview-field {
  display: flex;
  gap: 15px;
  margin-top: 18px;
}

.preview-field b {
  width: 100px;
}

.preview-field span {
  white-space: pre-wrap;
}

.sample-watermark {
  margin-top: 40px;
  text-align: center;
  font-size: 24px;
  font-weight: 800;
  opacity: .25;
  transform: rotate(-12deg);
}

@media (max-width: 900px) {

  .template-grid {
    grid-template-columns: 1fr;
  }

  .template-preview {
    transform-origin: top left;
  }

  .template-header {
    flex-direction: column;
  }

}
