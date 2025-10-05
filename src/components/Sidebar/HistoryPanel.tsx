import React, { useEffect, useState } from 'react';

interface HistoryPanelProps {
  onOpen?: (entry: any) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ onOpen }) => {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('urban_history_v1');
      const arr = raw ? JSON.parse(raw) : [];
      setItems(arr.reverse());
    } catch (e) {
      setItems([]);
    }
  }, []);

  const filtered = items.filter((it) => {
    if (!query) return true;
    return (it.note || '').toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar mapas por nombre o fecha..." style={{ width: '100%', padding: 8 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {filtered.map((it, idx) => (
          <div key={idx} style={{ background: '#0f1720', color: '#fff', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }} onClick={() => onOpen && onOpen(it)}>
            <div style={{ height: 96, background: 'linear-gradient(180deg,#1f2a33,#0d1316)' }} />
            <div style={{ padding: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{it.note || 'Snapshot'}</div>
              <div style={{ fontSize: 12, color: '#9aa4a8', marginTop: 6 }}>{new Date(it.ts).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPanel;
