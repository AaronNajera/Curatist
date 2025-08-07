
'use client';
import { useEffect, useState } from 'react';

function loadProjects(){ return JSON.parse(localStorage.getItem('curatist.projects')||'[]'); }
function saveProjects(p){ localStorage.setItem('curatist.projects', JSON.stringify(p)); }

export default function Home(){
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');

  useEffect(()=>{ setProjects(loadProjects()); }, []);

  function createProject(){
    if(!name.trim()) return;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const p = { id, name, createdAt: now, images:[], preferences:[], category:'wedding', mode:'smart', feedRatio:'4:5', packs:[], usedPacks:[] };
    const next = [p, ...projects];
    setProjects(next); saveProjects(next); setName('');
    window.location.href = `/project/${id}`;
  }

  function openProject(id){ window.location.href = `/project/${id}`; }

  return (
    <div>
      <div className="card">
        <h2>Create Project</h2>
        <input className="input" placeholder="Project name (e.g., Lily & Ryan — Maui Wedding)" value={name} onChange={e=>setName(e.target.value)} />
        <div style={{marginTop:8}}>
          <button className="btn" onClick={createProject}>New Project</button>
        </div>
      </div>

      <div className="card">
        <h2>Projects</h2>
        {projects.length===0 && <p>No projects yet.</p>}
        {projects.map(p => (
          <div key={p.id} className="card" style={{padding:'12px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <strong>{p.name}</strong>
                <div><small className="muted">{new Date(p.createdAt).toLocaleString()}</small></div>
              </div>
              <button className="btn secondary" onClick={()=>openProject(p.id)}>Open</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
