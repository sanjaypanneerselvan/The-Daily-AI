// script.js — Vanilla JS client

const API = 'http://localhost:8000/api/articles'
const perPage = 6
let articles = []
let currentPage = 1
let filtered = []

const paper = document.getElementById('paper')
const topStories = document.getElementById('topStories')
const grid = document.getElementById('articlesGrid')
const pagination = document.getElementById('pagination')
const categorySelect = document.getElementById('categorySelect')
const downloadBtn = document.getElementById('downloadBtn')
const shareBtn = document.getElementById('shareBtn')
const darkToggle = document.getElementById('darkToggle')
const dateSpan = document.getElementById('dateSpan')

dateSpan.textContent = new Date().toLocaleDateString()

// Utils: categorize by simple keyword matching
function categorizeArticle(a){
  const text = (a.title + ' ' + (a.summary || '')).toLowerCase()
  if (/india|delhi|mumbai|chennai|bangalore|kolkata|tamil|kerala|tamil nadu/.test(text)) return 'india'
  if (/sport|cricket|football|tennis|olympic|match|series/.test(text)) return 'sports'
  if (/tech|ai|software|google|microsoft|apple|meta|openai|laptop|app|startup/.test(text)) return 'tech'
  if (/business|economy|market|stock|inflation|bank|rbi|company/.test(text)) return 'business'
  return 'world'
}

// Fetch & initialize
async function loadArticles(){
  try{
    const res = await fetch(API + '?limit=30')
    const data = await res.json()
    articles = data.map(a => ({...a, category: categorizeArticle(a)}))
    filtered = articles
    currentPage = 1
    render()
  }catch(err){
    console.error('Failed to fetch', err)
    grid.innerHTML = '<p style="padding:12px">Failed to load articles. Start backend or check network.</p>'
  }
}

function render(){
  renderTop()
  renderGrid()
  renderPagination()
}

function renderTop(){
  topStories.innerHTML = ''
  const lead = filtered[0]
  if(!lead) return
  const leadDiv = document.createElement('div')
  leadDiv.className = 'lead'
  const imgHtml = lead.image ? `<img src="${lead.image}" alt="${escapeHtml(lead.title)}" style="max-width:100%;height:auto;margin-bottom:12px;">` : ''
  leadDiv.innerHTML = `
    ${imgHtml}
    <h2>${escapeHtml(lead.title)}</h2>
    <p class="meta">${lead.published ? new Date(lead.published).toLocaleString() : ''} • ${lead.category.toUpperCase()}</p>
    <p>${escapeHtml(lead.summary)}</p>
    <p><a href="${lead.link}" target="_blank" rel="noreferrer">Read full</a></p>
  `

  const side = document.createElement('aside')
  side.className = 'side-briefs'
  side.innerHTML = '<h4>Other headlines</h4>' +
    filtered.slice(1,6).map(it => `<p><strong>${escapeHtml(it.title)}</strong><br/><span class="meta">${it.published ? new Date(it.published).toLocaleDateString() : ''}</span></p>`).join('')

  topStories.appendChild(leadDiv)
  topStories.appendChild(side)
}

function renderGrid(){
  grid.innerHTML = ''
  const start = (currentPage-1)*perPage + 1 // skip lead
  const pageItems = filtered.slice(start, start + perPage)

  if(pageItems.length === 0){
    grid.innerHTML = '<p style="padding:12px">No articles in this category/page.</p>'
    return
  }

  pageItems.forEach(a => {
    const card = document.createElement('article')
    card.className = 'card'
    const imgHtml = a.image ? `<img src="${a.image}" alt="${escapeHtml(a.title)}" style="max-width:100%;height:auto;margin-bottom:8px;">` : ''
    card.innerHTML = `
      ${imgHtml}
      <h3>${escapeHtml(a.title)}</h3>
      <div class="meta">${a.published ? new Date(a.published).toLocaleString() : ''} • ${a.category.toUpperCase()}</div>
      <p>${escapeHtml(a.summary)}</p>
      <p><a href="${a.link}" target="_blank" rel="noreferrer">Read full</a></p>
    `
    grid.appendChild(card)
  })
}

function renderPagination(){
  pagination.innerHTML = ''
  const total = Math.max(1, Math.ceil((filtered.length - 1)/perPage))
  for(let i=1;i<=total;i++){
    const btn = document.createElement('button')
    btn.textContent = i
    if(i===currentPage) btn.classList.add('active')
    btn.addEventListener('click', ()=>{ currentPage = i; renderGrid(); renderPagination(); window.scrollTo({top:0,behavior:'smooth'}) })
    pagination.appendChild(btn)
  }
}

// Simple HTML escape
function escapeHtml(s){
  if(!s) return ''
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
}

// Category filter
categorySelect.addEventListener('change', ()=>{
  const v = categorySelect.value
  if(v === 'all') filtered = articles
  else filtered = articles.filter(a => a.category === v)
  currentPage = 1
  render()
})

// Download PDF — multi-page
downloadBtn.addEventListener('click', ()=>{
  const element = document.getElementById('paper')
  const opt = {
    margin: 0.4,
    filename: `Daily-AI-Newspaper-${new Date().toISOString().slice(0,10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  }

  window.html2pdf().set(opt).from(element).save()
})

// Share button (Web Share API with fallback to WhatsApp)
shareBtn.addEventListener('click', async ()=>{
  const url = window.location.href
  const text = `Here's today's Daily AI newspaper — ${new Date().toLocaleDateString()}`
  if(navigator.share){
    try{ await navigator.share({title:'Daily AI', text, url}) }catch(e){ console.warn('Share canceled',e) }
    return
  }
  const wa = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
  window.open(wa, '_blank')
})

// Dark mode toggle
function applyDark(dark){
  if(dark) document.body.classList.add('dark')
  else document.body.classList.remove('dark')
  localStorage.setItem('dark', dark ? '1' : '0')
}

darkToggle.addEventListener('click', ()=>{
  const isDark = document.body.classList.toggle('dark')
  localStorage.setItem('dark', isDark ? '1' : '0')
})

// Init dark setting
if(localStorage.getItem('dark') === '1') applyDark(true)

// On load
loadArticles()

// Expose load for manual refresh if needed
window.loadArticles = loadArticles
