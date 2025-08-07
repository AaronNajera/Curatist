
'use client';
import { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';

const GLOBAL_TAGS = ["intimate", "candid laughter", "golden hour", "black and white", "dramatic light", "natural light", "soft focus", "detail shot", "emotional moment", "outdoors", "indoors", "close-up", "wide shot", "silhouette", "romantic", "artistic blur", "moody tones", "storytelling", "joyful", "timeless"];
const CATEGORY_UNIQUE = {"wedding": ["bridal portrait", "groom portrait", "first look", "wedding rings", "bouquet", "boutonniere", "ceremony aisle", "wedding arch", "vows", "first kiss", "confetti toss", "grand exit", "reception d\u00e9cor", "cake cutting", "first dance", "sparkler send-off", "flower girl", "ring bearer", "bridesmaids", "groomsmen", "table setting", "wedding stationery", "veil shot", "champagne toast", "dance floor", "sweetheart table", "aisle d\u00e9cor", "wedding favors", "ceremony backdrop", "couple getaway"], "engagement": ["proposal", "ring close-up", "holding hands", "sunset walk", "coffee date", "urban backdrop", "mountaintop view", "seaside kiss", "picnic blanket", "city lights", "cozy sweaters", "leaning on wall", "forehead kiss", "laughing together", "dancing in street", "walking away", "sitting on steps", "behind the scenes", "warm embrace", "sunrise shoot", "vintage car", "casual outfits", "pets included", "rainy day kiss", "blanket wrap", "nature trail", "matching outfits", "playful chase", "romantic gaze", "shared drink"], "elopement": ["mountain ceremony", "cliffside vows", "barefoot bride", "hiking boots", "small bouquet", "backpack elopement", "waterfall backdrop", "coastal cliffs", "cabin morning", "handwritten vows", "wildflower meadow", "secluded beach", "forest clearing", "sunrise ceremony", "sunset elopement", "champagne pop", "intimate dinner", "campfire", "adventure session", "drone shot", "desert elopement", "vow exchange", "private toast", "handfasting", "micro cake", "barefoot groom", "mountain pass", "riverside kiss", "jeep getaway", "snow-covered vows"], "maternity": ["baby bump", "belly silhouette", "mom-to-be", "parents-to-be", "holding bump", "bump close-up", "flowing dress", "floral crown", "partner embrace", "barefoot in sand", "nursery background", "cozy bed", "soft blanket", "baby shoes", "ultrasound photo", "hands on belly", "belly kiss", "sunset glow", "ethereal fabric", "open field", "boho style", "long dress", "gentle smile", "side profile", "sitting on rock", "white dress", "sun hat", "meadow path", "bare belly", "swaying dress"], "family": ["group hug", "kids running", "playful tickle", "lifted in air", "holding hands", "family walk", "parents kiss", "kids laughing", "candid meal", "baking together", "park play", "fall leaves", "beach day", "reading books", "cozy couch", "matching pajamas", "siblings hug", "piggyback ride", "blanket fort", "sunny picnic", "snow play", "birthday cake", "family dog", "stroller walk", "bedtime story", "bike ride", "garden watering", "board games", "kite flying", "playground fun"], "general": ["portrait close-up", "lifestyle moment", "creative framing", "window light", "backlight", "editorial pose", "desk work", "hobby shot", "travel scene", "street photography", "food shot", "architecture", "abstract texture", "hand details", "shadow play", "color pop", "monochrome", "symmetry", "reflection", "minimalism", "everyday objects", "shoes close-up", "pattern wall", "soft background", "coffee mug", "laughter candid", "wind in hair", "workspace", "musician playing", "candid friends"]};

function loadProjects(){ return JSON.parse(localStorage.getItem('curatist.projects')||'[]'); }
function saveProjects(p){ localStorage.setItem('curatist.projects', JSON.stringify(p)); }

function aspectPadding(ratio){ return ratio==='3:4' ? '133.333%' : '125%'; }

export default function ProjectPage({ params }){
  const [projects, setProjects] = useState([]);
  const [proj, setProj] = useState(null);
  const [category, setCategory] = useState('wedding');
  const [prefs, setPrefs] = useState([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('smart');
  const [feedRatio, setFeedRatio] = useState('4:5');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(()=>{
    const ps = loadProjects();
    setProjects(ps);
    const p = ps.find(x=>x.id===params.id);
    if(!p) return;
    setProj(p);
    setCategory(p.category || 'wedding');
    setPrefs(p.preferences || []);
    setMode(p.mode || 'smart');
    setFeedRatio(p.feedRatio || '4:5');
  }, [params.id]);

  function updateProject(next){
    const list = projects.map(p => p.id===next.id ? next : p);
    setProjects(list); setProj(next); saveProjects(list);
  }

  async function makeThumb(file) {
    const bmp = await createImageBitmap(file);
    const max = 512;
    const scale = Math.min(1, max/Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bmp.width*scale));
    canvas.height = Math.max(1, Math.round(bmp.height*scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  async function onUpload(e){
    const files = Array.from(e.target.files||[]).filter(f=>f.type.startsWith('image/'));
    if(!files.length) return;
    const items = [];
    for(const f of files){
      const id = crypto.randomUUID();
      const objectUrl = URL.createObjectURL(f);
      let thumb = null; try { thumb = await makeThumb(f); } catch{}
      items.push({ id, name: f.name, objectUrl, thumb, size: f.size });
    }
    const next = { ...proj, images:[...(proj.images||[]), ...items] };
    updateProject(next);
    setDirty(true);
  }

  function togglePref(tag){
    let next = prefs.includes(tag) ? prefs.filter(t=>t!==tag) : [...prefs, tag];
    if(next.length>20) next = next.slice(0,20);
    setPrefs(next); setDirty(true);
    updateProject({ ...proj, preferences: next, category, mode, feedRatio });
  }

  function changeCategory(cat){ setCategory(cat); setDirty(true); updateProject({ ...proj, category:cat }); }
  function changeMode(m){ setMode(m); setDirty(true); updateProject({ ...proj, mode:m }); }
  function changeRatio(r){ setFeedRatio(r); setDirty(true); updateProject({ ...proj, feedRatio:r }); }

  const visibleTags = useMemo(()=>{
    const all = [...(CATEGORY_UNIQUE[category]||[]), ...GLOBAL_TAGS];
    if(!search.trim()) return all;
    const s = search.toLowerCase();
    return all.filter(t=>t.toLowerCase().includes(s));
  }, [category, search]);

  async function getImageMetrics(url){
    return new Promise(resolve=>{
      const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = ()=>{
        const w = img.naturalWidth, h = img.naturalHeight;
        const c = document.createElement('canvas'); c.width = Math.min(800,w); c.height = Math.min(800*h/w, h);
        const ctx = c.getContext('2d'); ctx.drawImage(img,0,0,c.width,c.height);
        const data = ctx.getImageData(0,0,c.width,c.height).data;
        let sum=0, sumSq=0, edges=0;
        for(let i=0;i<data.length;i+=4){ const y = 0.2126*data[i]+0.7152*data[i+1]+0.0722*data[i+2]; sum+=y; sumSq+=y*y; }
        const n = data.length/4; const variance = sumSq/n - (sum/n)*(sum/n);
        for(let y=1;y<c.height-1;y+=2){ for(let x=1;x<c.width-1;x+=2){ const p = (y*c.width + x)*4; const gx = data[p+4]-data[p-4]; const gy = data[p+c.width*4]-data[p-c.width*4]; const mag = Math.abs(gx)+Math.abs(gy); if(mag>100) edges++; } }
        resolve({ width:w, height:h, contrast: Math.max(0, Math.min(1, variance/5000)), edges });
      }; img.onerror = ()=>resolve({width:0,height:0,contrast:0,edges:0}); img.src = url;
    });
  }

  function tagMatchScore(fileName, selected){
    const lower = (fileName||'').toLowerCase();
    let score = 0;
    for(const t of selected){ if(lower.includes(t.split(' ')[0])) score += 0.1; }
    return Math.min(0.5, score);
  }

  async function scoreImages(images){
    const results = [];
    for(const img of images){
      const m = await getImageMetrics(img.objectUrl);
      const orientBonus = m.height >= m.width ? 0.15 : 0;
      const classic = 0.5*m.contrast + 0.2*(m.edges/500) + orientBonus;
      const tags = tagMatchScore(img.name, prefs);
      const smart = classic + tags;
      const score = mode==='classic' ? classic : smart;
      results.push({ id: img.id, score, metrics:m, ref: img });
    }
    results.sort((a,b)=>b.score-a.score);
    return results;
  }

  function pickUnique(sorted, count, used){
    const out=[];
    for(const r of sorted){ if(out.length>=count) break; if(used.has(r.id)) continue; out.push(r.ref); used.add(r.id);}
    return out;
  }

  async function generatePack(){
    if(!proj || (proj.images||[]).length===0) return;
    setBusy(true);
    const scores = await scoreImages(proj.images);
    const used = new Set();
    const pack = { category, prefs, mode, feedRatio, carousels:[], singles:[], minis:[] };
    for(let c=0;c<10;c++){ const pick = pickUnique(scores, 10, used); if(pick.length) pack.carousels.push({ id:crypto.randomUUID(), images: pick }); }
    for(let s=0;s<5;s++){ const pick = pickUnique(scores, 1, used); if(pick.length) pack.singles.push({ id:crypto.randomUUID(), images: pick }); }
    for(let m=0;m<5;m++){ const slides = Math.max(2, Math.min(9, Math.floor(Math.random()*8)+2)); const pick = pickUnique(scores, slides, used); if(pick.length) pack.minis.push({ id:crypto.randomUUID(), images: pick }); }
    const next = { ...proj, pack, lastGeneratedAt: new Date().toISOString() };
    updateProject(next);
    setDirty(false);
    setTimeout(()=>setBusy(false), 400);
  }

  async function exportZip(){
    if(!proj?.pack) return;
    const zip = new JSZip();
    const root = zip.folder((proj.name||'Curatist').replace(/[^a-z0-9\\- _]/gi,'_'));
    async function add(folderName, sets){
      const fld = root.folder(folderName);
      let idx=1;
      for(const set of sets){
        const sub = fld.folder(String(idx).padStart(2,'0'));
        let i=1; for(const img of set.images){ const blob = await fetch(img.objectUrl).then(r=>r.blob()); sub.file(`slide_${String(i).padStart(2,'0')}.jpg`, blob); i++; }
        idx++;
      }
    }
    await add("01_Carousels", proj.pack.carousels||[]);
    await add("02_Singles", proj.pack.singles||[]);
    await add("03_Minis", proj.pack.minis||[]);
    const blob = await zip.generateAsync({type:'blob'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download="Curatist_Pack.zip"; a.click(); URL.revokeObjectURL(url);
    const next = { ...proj, usedPacks:[...(proj.usedPacks||[]), { at:new Date().toISOString() }] };
    updateProject(next);
  }

  if(!proj) return <div className="card"><p>Project not found.</p></div>;

  const total = (proj.images||[]).length;
  const start = (page-1)*pageSize; const end = Math.min(total, start+pageSize);
  const visible = (proj.images||[]).slice(start,end);
  const pad = aspectPadding(feedRatio);

  return (
    <div>
      <div className="card" style={{position:'relative'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><h2 style={{marginBottom:4}}>{proj.name}</h2><small style={{color:'#666'}}>{total} images uploaded</small></div>
          <div className="toolbar">
            <a className="btn secondary" href="/">Back to Home</a>
            <button className="btn secondary" onClick={generatePack} disabled={busy || !proj.images?.length}>{dirty ? 'Refresh (tags updated)' : 'Regenerate'}</button>
          </div>
        </div>
        {busy && (
          <div style={{position:'absolute',inset:0,backdropFilter:'blur(2px)',background:'rgba(255,255,255,.7)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:12}}>
            <div className="spinner" />
            <div style={{marginTop:10,fontFamily:'Playfair Display,serif'}}>Curating your best shots...</div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="toolbar">
          <div style={{flex:1}}>
            <label>Upload Images</label>
            <input type="file" accept="image/*" multiple onChange={onUpload} className="input" />
          </div>
          <div>
            <label>Feed Preview Ratio</label>
            <div style={{display:'flex',gap:8}}>
              <button className={"btn secondary"} style={{opacity:feedRatio==='4:5'?1:0.7}} onClick={()=>changeRatio('4:5')}>4:5</button>
              <button className={"btn secondary"} style={{opacity:feedRatio==='3:4'?1:0.7}} onClick={()=>changeRatio('3:4')}>3:4</button>
            </div>
          </div>
        </div>
        <div className="grid" style={{marginTop:10}}>
          {visible.map(img => (
            <div key={img.id}>
              <div style={{position:'relative',width:'100%',paddingTop:pad,background:'#f6f6f6',borderRadius:8,overflow:'hidden'}}>
                <img src={img.thumb || img.objectUrl} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />
              </div>
            </div>
          ))}
        </div>
        {total>pageSize && (
          <div style={{marginTop:10,display:'flex',gap:8,alignItems:'center'}}>
            <button className="btn secondary" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Prev</button>
            <span>Page {page} / {Math.ceil(total/pageSize)}</span>
            <button className="btn secondary" disabled={end>=total} onClick={()=>setPage(p=>p+1)}>Next</button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Category & Tags</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:12}}>
          <div>
            <label>Category</label>
            <select className="select" value={category} onChange={e=>changeCategory(e.target.value)}>
              {Object.keys(CATEGORY_UNIQUE).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <div className="hr" />
            <label>AI Mode</label>
            <div style={{display:'flex',gap:8,marginTop:6}}>
              <button className={"btn secondary"} style={{opacity:mode==='classic'?1:0.7}} onClick={()=>changeMode('classic')}>Classic (fast)</button>
              <button className={"btn secondary"} style={{opacity:mode==='smart'?1:0.7}} onClick={()=>changeMode('smart')}>Smart</button>
            </div>
          </div>
          <div>
            <div style={{display:'flex',gap:8,margin:'8px 0'}}>
              <input className="input" placeholder="Search tags..." value={search} onChange={e=>setSearch(e.target.value)} />
              <div className="btn ghost">Selected: {prefs.length}/20</div>
            </div>
            <div className="preferences">
              {[...(CATEGORY_UNIQUE[category]||[]), ...GLOBAL_TAGS].filter(t => !search || t.toLowerCase().includes(search.toLowerCase())).map(t => (
                <div key={t} className={"pref"+(prefs.includes(t)?" active":"")} onClick={()=>togglePref(t)}>{t}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Generate</h3>
        <div className="toolbar">
          <button className="btn" onClick={generatePack} disabled={!proj.images?.length || busy}>{busy?'Generating...':'Generate Posting Pack'}</button>
          {proj.pack && <button className="btn secondary" onClick={exportZip}>Export Pack (ZIP)</button>}
        </div>
      </div>

      {proj.pack && (
        <div className="card">
          <h3>Preview — IG {feedRatio}</h3>
          <div>
            <h4>Carousels ({proj.pack.carousels.length})</h4>
            {proj.pack.carousels.map((c,idx)=>(
              <div key={c.id} className="card">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <strong>Carousel {idx+1}</strong>
                </div>
                <div className="grid">
                {c.images.map((img, i)=>(
                  <div key={img.id} style={{position:'relative'}}>
                    <div style={{position:'relative',width:'100%',paddingTop:pad,background:'#f6f6f6',borderRadius:8,overflow:'hidden'}}>
                      <img src={img.thumb||img.objectUrl} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />
                    </div>
                  </div>
                ))}
                </div>
              </div>
            ))}
            <h4>Singles ({proj.pack.singles.length})</h4>
            {proj.pack.singles.map((s,idx)=>(
              <div key={s.id} className="card">
                <strong>Single {idx+1}</strong>
                {s.images[0] && (
                  <div style={{position:'relative',width:'30%'}}>
                    <div style={{position:'relative', width:'100%', paddingTop:pad, background:'#f6f6f6', borderRadius:6, overflow:'hidden'}}>
                      <img src={s.images[0].thumb || s.images[0].objectUrl} style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'}} />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <h4>Minis ({proj.pack.minis.length})</h4>
            {proj.pack.minis.map((m,idx)=>(
              <div key={m.id} className="card">
                <strong>Mini {idx+1}</strong>
                <div className="grid">
                  {m.images.map((img,i)=>(
                    <div key={img.id} style={{position:'relative'}}>
                      <div style={{position:'relative',width:'100%',paddingTop:pad,background:'#f6f6f6',borderRadius:8,overflow:'hidden'}}>
                        <img src={img.thumb||img.objectUrl} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
