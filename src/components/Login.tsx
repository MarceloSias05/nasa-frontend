import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Hardcoded credentials (change if you want)
  const HARD_USERNAME = 'admin';
  const HARD_PASSWORD = 'admin';

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (username === HARD_USERNAME && password === HARD_PASSWORD) {
      setError(null);
      onLogin();
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#071821'
    }}>
      <form onSubmit={submit} style={{
        width: 420,
        padding: 28,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.03)',
        boxShadow: '0 6px 30px rgba(0,0,0,0.6)',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: 12 }}>
          <img src="/nasa_logo.png" alt="logo" style={{ width: 120, height: 120}} />
        </div>
        <h2 style={{ margin: '6px 0 18px', color: '#fff' }}>Urban EarthLens</h2>

        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.4)', color: '#fff' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.4)', color: '#fff' }}
          />
        </div>

        <div style={{ textAlign: 'left', marginBottom: 12 }}>
          <button type="button" onClick={() => {}} style={{ background: 'none', border: 'none', padding: 0, color: '#4fc3f7', fontSize: 13, cursor: 'pointer' }}>Forgot your password?</button>
        </div>

        {error && <div style={{ color: '#ff8080', marginBottom: 12 }}>{error}</div>}

        <button type="submit" style={{
          width: '100%', padding: '12px 14px', borderRadius: 8, border: 'none', background: '#09a3e8', color: '#fff', fontWeight: 700
        }}>Log In</button>

        <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
        </div>
      </form>
    </div>
  );
};

export default Login;
