function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function badgeClass(d){const l=(d||'').toLowerCase();if(l.includes('easy')||l.includes('basic'))return'badge-easy';if(l.includes('medium'))return'badge-medium';if(l.includes('hard')||l.includes('expert'))return'badge-hard';return'badge-na';}
function showAlert(el,msg,type){el.innerHTML=msg;el.className=`alert alert-${type} show`;setTimeout(()=>el.classList.remove('show'),8000);}

async function refreshCache(){
  const d=await(await fetch('/api/cache-info')).json();
  document.getElementById('stat-count').textContent=d.exists?d.count:'0';
  document.getElementById('stat-date').textContent=d.exists?d.scraped_at.slice(0,16).replace('T',' '):'None';
}
refreshCache();
document.getElementById('btn-refresh').addEventListener('click',refreshCache);
document.getElementById('btn-clear').addEventListener('click',async()=>{
  if(!confirm('Delete all cached article data?'))return;
  await fetch('/api/cache',{method:'DELETE'});
  document.getElementById('article-grid').innerHTML=emptyHTML();
  refreshCache();
});

let pollTimer=null;
async function startScrape(){
  const btn=document.getElementById('btn-scrape');
  btn.disabled=true;btn.textContent='⏳ Scraping…';
  document.getElementById('progress-wrap').classList.add('visible');
  const res=await fetch('/api/scrape',{method:'POST'});
  if(res.status===409){showAlert(document.getElementById('scrape-alert'),'A job is already running.','info');btn.disabled=false;btn.textContent='▶ Start Scraping';return;}
  pollTimer=setInterval(pollStatus,1200);
}
async function pollStatus(){
  const d=await(await fetch('/api/scrape/status')).json();
  const fill=document.getElementById('progress-fill'),pct=document.getElementById('progress-pct'),lbl=document.getElementById('progress-label'),url=document.getElementById('progress-url');
  if(d.total>0){const p=Math.round((d.progress/d.total)*100);fill.style.width=p+'%';pct.textContent=p+'%';lbl.textContent=`Article ${d.progress} of ${d.total}`;url.textContent=d.current_url;}
  else{fill.style.width='5%';lbl.textContent='Fetching article list…';}
  if(d.done){
    clearInterval(pollTimer);
    const btn=document.getElementById('btn-scrape');btn.disabled=false;btn.textContent='▶ Start Scraping';
    fill.style.width='100%';pct.textContent='100%';
    if(d.error)showAlert(document.getElementById('scrape-alert'),'❌ '+d.error,'danger');
    else{showAlert(document.getElementById('scrape-alert'),`✅ Done! ${d.articles_count} articles scraped.`,'success');refreshCache();loadArticles();}
  }
}
document.getElementById('btn-scrape').addEventListener('click',startScrape);

let _articles=[],_filtered=[];
function emptyHTML(msg){return`<div class="empty"><div class="empty-icon">📄</div><p>${msg||'No articles loaded yet.<br>Run the scraper or click <strong>Load Articles</strong>.'}</p></div>`;}
async function loadArticles(){
  const data=await(await fetch('/api/articles')).json();
  _articles=data.articles||[];_filtered=[..._articles];
  if(!_articles.length){document.getElementById('article-grid').innerHTML=emptyHTML('No cached articles. Run the scraper first.');return;}
  renderArticles(_filtered);
}
function renderArticles(list){
  const grid=document.getElementById('article-grid');
  if(!list.length){grid.innerHTML=emptyHTML('No matches found.');return;}
  grid.innerHTML=list.map(a=>`
    <div class="a-card" onclick="openModal(${_articles.indexOf(a)})">
      <div class="a-card-title">${esc(a.title||'Untitled')}</div>
      <div class="a-card-footer">
        <span class="badge ${badgeClass(a.difficulty)}">${esc(a.difficulty||'N/A')}</span>
        <span class="a-card-time">${(a.scraped_at||'').slice(0,10)}</span>
      </div>
    </div>`).join('');
}
function filterArticles(){const q=document.getElementById('search-input').value.toLowerCase();_filtered=_articles.filter(a=>(a.title||'').toLowerCase().includes(q));renderArticles(_filtered);}
document.getElementById('btn-load').addEventListener('click',loadArticles);

function openModal(idx){
  const a=_articles[idx];
  document.getElementById('modal-title').textContent=a.title||'Untitled';
  const diff=document.getElementById('modal-difficulty');diff.textContent=a.difficulty||'Not Available';diff.className=`badge ${badgeClass(a.difficulty)}`;
  document.getElementById('modal-concepts').textContent=a.concepts||'Not Available';
  document.getElementById('modal-complexity').textContent=a.complexity||'Not Available';
  document.getElementById('modal-code').innerHTML=(a.code_snippets||['Not Available']).map(s=>`<pre>${esc(s)}</pre>`).join('');
  const refs=a.references||[{text:'Not Available',url:''}];
  document.getElementById('modal-refs').innerHTML=refs.map(r=>`<li>${r.url?`<a href="${esc(r.url)}" target="_blank">${esc(r.text)}</a>`:esc(r.text)}</li>`).join('');
  const u=document.getElementById('modal-url');u.href=a.url||'#';u.textContent=a.url||'N/A';
  document.getElementById('modal-backdrop').classList.add('open');
}
document.getElementById('modal-close').addEventListener('click',()=>document.getElementById('modal-backdrop').classList.remove('open'));
document.getElementById('modal-backdrop').addEventListener('click',e=>{if(e.target===document.getElementById('modal-backdrop'))document.getElementById('modal-backdrop').classList.remove('open');});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('modal-backdrop').classList.remove('open');});

async function generatePdf(){
  const btn=document.getElementById('btn-gen-pdf');
  const name=document.getElementById('student-name').value.trim()||'NovaScrape System';
  btn.disabled=true;btn.textContent='⏳ Generating…';
  const res=await fetch('/api/generate-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({student_name:name})});
  const data=await res.json();
  btn.disabled=false;btn.textContent='⬇ Generate PDF';
  if(!res.ok||data.error){showAlert(document.getElementById('pdf-alert'),'❌ '+(data.error||'Unknown error'),'danger');return;}
  showAlert(document.getElementById('pdf-alert'),`✅ PDF ready: <strong>${data.filename}</strong>`,'success');
  loadPdfList();
}
document.getElementById('btn-gen-pdf').addEventListener('click',generatePdf);

async function loadPdfList(){
  const pdfs=await(await fetch('/api/pdfs')).json();
  const div=document.getElementById('pdf-list');
  if(!pdfs.length){div.innerHTML='';return;}
  div.innerHTML=`<div class="pdf-divider">Generated PDFs</div>`+pdfs.map(p=>`
    <div class="pdf-row">
      <div>
        <div class="pdf-row-name">${esc(p.filename)}</div>
        <div class="pdf-row-meta">${p.size_kb} KB</div>
      </div>
      <div class="pdf-row-actions">
        <a href="${esc(p.download_url)}" download class="btn btn-dl btn-sm">⬇ Download</a>
        <button class="btn btn-rose btn-sm" onclick="deletePdf('${esc(p.filename)}')">🗑 Remove</button>
      </div>
    </div>`).join('');
}
async function deletePdf(filename){
  if(!confirm(`Remove "${filename}"?`))return;
  const res=await fetch(`/api/delete-pdf/${encodeURIComponent(filename)}`,{method:'DELETE'});
  if(res.ok)loadPdfList();else alert('Failed to delete.');
}
loadPdfList();