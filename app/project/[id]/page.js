    'use client';
    import { useEffect, useMemo, useState } from 'react';
    import JSZip from 'jszip';

    const PREFS = [
      "florals","sunsets","intimate","details","rings","dress","wide venue",
      "candid laughter","first look","parent moments","bridal portraits","groom portraits",
      "bridal party","reception energy","dance floor","silhouette","ocean backdrops",
      "greenery","pastel tones","ceremony vows"
    ];

    function loadProjects(){
      return JSON.parse(localStorage.getItem('ppp.projects')||'[]');
    }
    function saveProjects(p){ localStorage.setItem('ppp.projects', JSON.stringify(p)); }

    function pickUnique(arr, count, usedSet){
      const out = [];
      for(const item of arr){
        if(out.length>=count) break;
        if(usedSet.has(item.id)) continue;
        out.push(item);
      }
      return out;
    }

    function dataUrlFromFile(file){
      return new Promise((resolve)=>{
        const fr = new FileReader();
        fr.onload = ()=> resolve(fr.result);
        fr.readAsDataURL(file);
      });
    }

    export default function ProjectPage({ params }){
      const [projects, setProjects] = useState([]);
      const [proj, setProj] = useState(null);
      const [prefs, setPrefs] = useState([]);
      const [slidesPerCarousel, setSlidesPerCarousel] = useState(10);
      const [carouselsCount, setCarouselsCount] = useState(10);
      const [singlesCount, setSinglesCount] = useState(5);
      const [miniCount, setMiniCount] = useState(5);
      const [uniqueness, setUniqueness] = useState(0.85);
      const [busy, setBusy] = useState(false);

      useEffect(()=>{
        const ps = loadProjects();
        setProjects(ps);
        const p = ps.find(x=>x.id===params.id);
        setProj(p);
        setPrefs(p?.preferences || []);
      }, [params.id]);

      function updateProject(next){
        const list = projects.map(p => p.id===next.id ? next : p);
        setProjects(list); setProj(next); saveProjects(list);
      }

      async function onUpload(e){
        const files = Array.from(e.target.files||[]).filter(f=>f.type.startsWith('image/'));
        if(files.length===0) return;
        const withUrls = [];
        for(const f of files){
          const url = await dataUrlFromFile(f);
          withUrls.push({ id: crypto.randomUUID(), name: f.name, url, size: f.size });
        }
        const next = { ...proj, images: [...(proj.images||[]), ...withUrls] };
        updateProject(next);
      }

      function togglePref(p){
        let next = prefs.includes(p) ? prefs.filter(x=>x!==p) : [...prefs, p];
        next = next.slice(0,20);
        setPrefs(next);
        updateProject({ ...proj, preferences: next });
      }

      function randomShuffle(arr){
        const a = [...arr];
        for(let i=a.length-1; i>0; i--){
          const j = Math.floor(Math.random()*(i+1));
          [a[i],a[j]]=[a[j],a[i]];
        }
        return a;
      }

      function generatePack(){
        if(!proj || (proj.images||[]).length===0) return;
        setBusy(true);
        const imgs = randomShuffle(proj.images);
        const used = new Set();
        const pack = { carousels:[], singles:[], minis:[] };

        // Carousels
        for(let c=0;c<carouselsCount;c++){
          const pick = pickUnique(imgs, slidesPerCarousel, used);
          pick.forEach(x=>used.add(x.id));
          if(pick.length>0) pack.carousels.push({ id: crypto.randomUUID(), images: pick });
        }
        // Singles
        for(let s=0;s<singlesCount;s++){
          const pick = pickUnique(imgs, 1, used);
          pick.forEach(x=>used.add(x.id));
          if(pick.length>0) pack.singles.push({ id: crypto.randomUUID(), images: pick });
        }
        // Minis (2–9)
        for(let m=0;m<miniCount;m++){
          const slides = Math.max(2, Math.min(9, Math.floor(Math.random()*8)+2));
          const pick = pickUnique(imgs, slides, used);
          pick.forEach(x=>used.add(x.id));
          if(pick.length>0) pack.minis.push({ id: crypto.randomUUID(), images: pick });
        }

        const next = { ...proj, pack, lastGeneratedAt: new Date().toISOString() };
        updateProject(next);
        setBusy(false);
      }

      function captionsForPost(idx, type){
        const baseTags = ["#MauiWedding","#HawaiiBride","#WeddingPhotographer","#JustMarried","#IslandWedding","#MauiVenues","#LoveInFrames","#SouthMaui","#Kapalua","#Wailea","#SunsetWedding","#FloralDesign"];
        const lines = [
          `Golden light, ocean breeze, forever in a frame.`,
          `From quiet glances to wild dance floors — every moment matters.`,
          `Details + emotion — the heart of this day.`,
          `Sunset vows and salty air — say no more.`,
          `Tiny details, big feelings.`
        ];
        return lines.map(l => `${l}

${baseTags.join(' ')}`);
      }

      async function exportZip(){
        if(!proj?.pack) return;
        const zip = new JSZip();
        const root = zip.folder(proj.name.replace(/[^a-z0-9\- _]/gi,'_'));

        const addImages = async (folderName, sets) => {
          const fld = root.folder(folderName);
          let idx = 1;
          for(const set of sets){
            const sub = fld.folder(String(idx).padStart(2,'0'));
            let slide = 1;
            for(const img of set.images){
              const data = img.url.split(',')[1]; // data URL
              sub.file(`slide_${String(slide).padStart(2,'0')}.jpg`, data, {base64:true});
              slide++;
            }
            // captions
            sub.file(`captions.txt`, captionsForPost(idx, folderName).map((c,i)=>`Option ${i+1}:\n${c}`).join('\n\n'));
            idx++;
          }
        };

        await addImages("01_Carousels", proj.pack.carousels||[]);
        await addImages("02_Singles", proj.pack.singles||[]);
        await addImages("03_MiniCarousels", proj.pack.minis||[]);

        const blob = await zip.generateAsync({type:"blob"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (proj.name||'posting_pack').replace(/[^a-z0-9\- _]/gi,'_') + ".zip";
        a.click();
        URL.revokeObjectURL(url);

        const next = { ...proj, pack: { ...proj.pack, exportedAt: new Date().toISOString() } };
        updateProject(next);
      }

      if(!proj) return <div className="card"><p>Project not found.</p></div>;

      return (
        <div>
          <div className="card">
            <h2>{proj.name}</h2>
            <div><small className="muted">{proj.images?.length||0} images uploaded</small>
              {proj.pack?.exportedAt && <span className="badge">Exported</span>}
            </div>
          </div>

          <div className="card">
            <h3>Upload Images</h3>
            <input type="file" accept="image/*" multiple onChange={onUpload} />
            <div className="grid" style={{marginTop:10}}>
              {(proj.images||[]).slice(0,12).map(img => (
                <img key={img.id} src={img.url} alt="" style={{width:'100%',borderRadius:8,objectFit:'cover',height:120}} />
              ))}
            </div>
            {(proj.images||[]).length>12 && <small className="muted">+{(proj.images||[]).length-12} more…</small>}
          </div>

          <div className="card">
            <h3>Preferences (choose up to 20)</h3>
            <div className="preferences">
              {PREFS.map(p => (
                <div key={p} className={"pref"+(prefs.includes(p)?" active":"")} onClick={()=>togglePref(p)}>{p}</div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Posting Pack Settings</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              <div>
                <label>Slides per carousel</label>
                <input className="input" type="number" min="4" max="10" value={slidesPerCarousel} onChange={e=>setSlidesPerCarousel(parseInt(e.target.value||'10'))} />
              </div>
              <div>
                <label>Carousels</label>
                <input className="input" type="number" min="1" max="10" value={carouselsCount} onChange={e=>setCarouselsCount(parseInt(e.target.value||'10'))} />
              </div>
              <div>
                <label>Singles</label>
                <input className="input" type="number" min="0" max="5" value={singlesCount} onChange={e=>setSinglesCount(parseInt(e.target.value||'5'))} />
              </div>
              <div>
                <label>Mini-Carousels</label>
                <input className="input" type="number" min="0" max="5" value={miniCount} onChange={e=>setMiniCount(parseInt(e.target.value||'5'))} />
              </div>
            </div>
            <div style={{marginTop:12}}>
              <button className="btn" disabled={busy || (proj.images||[]).length===0} onClick={generatePack}>
                {busy ? 'Generating…' : 'Generate Posting Pack'}
              </button>
              {proj.pack && <button style={{marginLeft:8}} className="btn secondary" onClick={exportZip}>Export Pack (ZIP)</button>}
            </div>
          </div>

          {proj.pack && (
            <div className="card">
              <h3>Preview</h3>
              <div>
                <h4>Carousels ({proj.pack.carousels.length})</h4>
                {proj.pack.carousels.map((c,idx)=>(
                  <div key={c.id} className="card">
                    <strong>Carousel {idx+1}</strong>
                    <div className="grid">
                      {c.images.map(img => <img key={img.id} src={img.url} style={{width:'100%',height:100,objectFit:'cover',borderRadius:6}} />)}
                    </div>
                  </div>
                ))}
                <h4>Singles ({proj.pack.singles.length})</h4>
                {proj.pack.singles.map((s,idx)=>(
                  <div key={s.id} className="card">
                    <strong>Single {idx+1}</strong>
                    {s.images[0] && <img src={s.images[0].url} style={{width:'30%',borderRadius:6}} />}
                  </div>
                ))}
                <h4>Mini-Carousels ({proj.pack.minis.length})</h4>
                {proj.pack.minis.map((m,idx)=>(
                  <div key={m.id} className="card">
                    <strong>Mini {idx+1}</strong>
                    <div className="grid">
                      {m.images.map(img => <img key={img.id} src={img.url} style={{width:'100%',height:100,objectFit:'cover',borderRadius:6}} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
