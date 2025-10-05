import React, { useEffect, useState } from 'react';

const PAGE_SIZE = 6;

const HistoryPage: React.FC<{ onOpen?: (entry: any) => void }> = ({ onOpen }) => {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('urban_history_v1');
      const arr = raw ? JSON.parse(raw) : [];
      setItems(arr.reverse());
    } catch {
      setItems([]);
    }
  }, []);

  const filtered = items.filter((it) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (it.note || '').toLowerCase().includes(q) || new Date(it.ts).toLocaleString().toLowerCase().includes(q);
  });

  const total = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ color: '#fff', marginBottom: 8 }}>Mis Mapas y Proyectos</h1>
      <p style={{ color: '#9aa4a8', marginTop: 0 }}>Aquí puedes encontrar todos tus mapas y proyectos guardados. Utiliza la barra de búsqueda o los filtros para encontrar rápidamente lo que necesitas.</p>

      <div style={{ marginTop: 18, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Buscar mapas por nombre o fecha..." style={{ flex: 1, padding: '10px 12px', borderRadius: 8 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {pageItems.length ? pageItems.map((it, idx) => (
          <div key={idx} style={{ background: '#0f1720', borderRadius: 10, overflow: 'hidden', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div style={{ height: 140, background: '#15202b' }} />
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{it.note || 'Snapshot'}</div>
              <div style={{ fontSize: 13, color: '#9aa4a8', marginTop: 6 }}>{new Date(it.ts).toLocaleDateString()}</div>
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', color: '#9aa4a8' }}>No hay mapas guardados.</div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18, gap: 8, alignItems: 'center' }}>
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>‹</button>
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} onClick={() => setPage(i + 1)} style={{ background: i + 1 === page ? '#0b74c9' : 'transparent', color: i + 1 === page ? '#fff' : '#9aa4a8', borderRadius: 18, width: 34, height: 34 }}>{i + 1}</button>
        ))}
        <button onClick={() => setPage(Math.min(total, page + 1))} disabled={page >= total}>›</button>
      </div>
    </div>
  );
};

export default HistoryPage;
