import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, isApiError } from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [tab, setTab]         = useState<'login' | 'register'>('login');
  const [email, setEmail]     = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login'
        ? { email, password }
        : { email, password, username };
      const data = await apiFetch<{ token: string }>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      login(data.token);
      navigate('/campaigns');
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-google-gray-bg flex items-center justify-center">
      <div className="bg-white border border-google-gray-light rounded-lg w-96 overflow-hidden shadow-sm">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-google-gray-light">
          <div className="text-google-blue text-3xl font-medium mb-1">SEA</div>
          <div className="text-google-gray-dark text-xl font-normal">AdArena Simulator</div>
          <p className="text-google-gray text-sm mt-2">
            {tab === 'login' ? 'Bei Ihrem Konto anmelden' : 'Neues Konto erstellen'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-google-gray-light">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors
                ${tab === t
                  ? 'text-google-blue border-b-2 border-google-blue -mb-px'
                  : 'text-google-gray hover:text-google-gray-dark hover:bg-google-gray-bg'
                }`}
            >
              {t === 'login' ? 'Anmelden' : 'Registrieren'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs text-google-gray mb-1">Benutzername</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder="max.muster"
                className="w-full h-9 px-3 border border-google-gray-light rounded text-sm
                           focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-google-gray mb-1">E-Mail-Adresse</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="name@beispiel.de"
              className="w-full h-9 px-3 border border-google-gray-light rounded text-sm
                         focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue"
            />
          </div>

          <div>
            <label className="block text-xs text-google-gray mb-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full h-9 px-3 border border-google-gray-light rounded text-sm
                         focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue"
            />
          </div>

          {error && (
            <p className="text-google-red text-sm bg-google-red-bg rounded px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 bg-google-blue hover:bg-google-blue-dark disabled:bg-google-gray-light
                       text-white text-sm font-medium rounded transition-colors mt-1"
          >
            {loading ? 'Bitte warten…' : tab === 'login' ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>
      </div>
    </div>
  );
}
