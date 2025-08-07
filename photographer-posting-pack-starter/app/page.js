'use client';
import { useEffect, useState } from 'react';

function loadProjects(){
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('ppp.projects')||'[]');
}
function saveProjects(p){ localStorage.setItem('ppp.projects', JSON.stringify(p)); }

export default function Home(){
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');

  useEffect(()=>{ setProjects(loadProjects()); }, []);

  function createProject(){
    if(!name.trim()) return;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const p = { id, name, createdAt: now, images:[], preferences:[], pack:null };
    const next = [p, ...projects];
    setProjects(next);
    saveProjects(next);
    setName('');
  }

  function openProject(id){
    window.location.href = `/project/${id}`;
  }

  return (
    <div>
      <div className="card">
        <h2>New Project</h2>
        <input className="input" placeholder="e.g., Lily & Ryan — Maui Wedding" value={name} onChange={e=>setName(e.target.value)} />
        <div style={{marginTop:10}}>
          <button className="btn" onClick={createProject}>Create Project</button>
        </div>
      </div>

      <div className="card">
        <h2>Projects</h2>
        {projects.length===0 && <p>No projects yet. Create one above.</p>}
        <div>
          {projects.map(p=> (
            <div key={p.id} className="card" style={{padding:'12px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <strong>{p.name}</strong>
                  {p.pack?.exportedAt && <span className="badge">Exported</span>}
                  <div><small className="muted">{new Date(p.createdAt).toLocaleString()}</small></div>
                </div>
                <button className="btn secondary" onClick={()=>openProject(p.id)}>Open</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
