import { useState } from 'react';
import { supabase } from "@/lib/supabase"; 
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error) {
      alert("Login Error: " + error.message);
      setLoading(false);
    } else {
      navigate('/map');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="p-8 bg-white shadow-2xl rounded-3xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
             <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 font-playfair">MAPA Bohol</h2>
          <p className="text-slate-500 mt-2">Cultural Heritage Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Admin Email</label>
            <input 
              type="email" 
              placeholder="admin@example.com" 
              /* Added text-slate-900 and placeholder-slate-400 for visibility */
              className="w-full p-4 mt-1 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              /* Added text-slate-900 and placeholder-slate-400 for visibility */
              className="w-full p-4 mt-1 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
          >
            {loading ? "Verifying..." : "Login as Administrator"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-semibold">Public Access</span></div>
        </div>

        <button 
          onClick={() => navigate('/map')} 
          className="w-full p-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all border border-slate-200"
        >
          Continue as Viewer
        </button>
      </div>
    </div>
  );
}