import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 Added for redirection
import { 
  Mail, Lock, Eye, EyeOff, Sun, Moon, 
  Loader2, ArrowRight, Radio, Mic2 
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext'; // 👈 Import Auth Logic

// 👇 Ensure this path matches where you saved your SVG
import radioMascot from '../../assets/images/radio-mascot.svg'; 

// --- SUB-COMPONENT: RADIO-STYLE INPUT ---
const InputField = ({ icon: Icon, type, placeholder, value, onChange, name }) => {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="relative group">
      {/* Icon with Glow Effect on Focus */}
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:text-[var(--accent-color)]" style={{ color: 'var(--text-secondary)' }}>
        <Icon size={20} className="group-focus-within:drop-shadow-[0_0_8px_rgba(255,106,0,0.5)]" />
      </div>

      <input
        type={isPassword ? (showPass ? 'text' : 'password') : type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl py-4 pl-12 pr-12 outline-none border transition-all duration-300 bg-transparent"
        style={{ 
          color: 'var(--text-primary)',
          borderColor: 'var(--border-color)',
        }}
        // "Studio Console" focus effect
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent-color)';
          e.target.style.backgroundColor = 'var(--bg-secondary)';
          e.target.style.boxShadow = '0 0 0 1px var(--accent-color)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-color)';
          e.target.style.backgroundColor = 'transparent';
          e.target.style.boxShadow = 'none';
        }}
      />

      {isPassword && (
        <button 
          type="button"
          onClick={() => setShowPass(!showPass)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors cursor-pointer hover:text-[var(--text-primary)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
        </button>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: PRO GOOGLE BUTTON ---
const GoogleButton = ({ onClick }) => (
  <button 
    type="button"
    onClick={onClick}
    className="w-full relative overflow-hidden group flex items-center justify-center gap-3 py-4 rounded-xl border transition-all duration-300 hover:border-[var(--text-secondary)] active:scale-[0.98]"
    style={{ 
      borderColor: 'var(--border-color)',
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)'
    }}
  >
    {/* Hover Gradient Background */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-r from-transparent via-white to-transparent" />
    
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.52 12.29C23.52 11.43 23.44 10.6 23.3 9.8H12V14.51H18.47C18.18 15.99 17.25 17.24 15.91 18.15V21.16H19.75C22 19.07 23.52 16.03 23.52 12.29Z" fill="#4285F4"/>
      <path d="M12 24C15.24 24 17.96 22.92 19.95 21.08L16.09 18.04C15.01 18.77 13.63 19.19 12 19.19C8.87 19.19 6.22 17.07 5.27 14.2H1.3V17.26C3.26 21.17 7.31 24 12 24Z" fill="#34A853"/>
      <path d="M5.27 14.2C5.03 13.33 4.9 12.43 4.9 11.5C4.9 10.57 5.03 9.67 5.27 8.8V5.74H1.3C0.47 7.39 0 9.25 0 11.5C0 13.75 0.47 15.61 1.3 17.26L5.27 14.2Z" fill="#FBBC05"/>
      <path d="M12 4.79999C13.77 4.79999 15.35 5.40999 16.6 6.59999L20.03 3.16C17.96 1.23 15.24 0 12 0C7.31 0 3.26 2.83 1.3 6.74L5.27 9.8C6.22 6.93 8.87 4.79999 12 4.79999Z" fill="#EA4335"/>
    </svg>
    <span className="font-semibold text-sm tracking-wide">Continue with Google</span>
  </button>
);

// --- MAIN PAGE COMPONENT ---
export default function LoginPage() {
  const { themeName, toggleTheme } = useTheme();
  const { login } = useAuth(); // 👈 Hook into Auth Logic
  const navigate = useNavigate(); // 👈 Navigation hook

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return toast.error("Please fill in all fields");
    
    setLoading(true);

    // 👇 REAL API CALL (Replaces setTimeout)
    const result = await login(formData);

    setLoading(false);

    if (result.success) {
      toast.success("Welcome back!");
      navigate('/admin/'); // 👈 Redirect on success
    } else {
      toast.error(result.error || "Login failed");
    }
  };

  const handleGoogleLogin = () => {
    // 👇 Redirect to backend for Google OAuth
    window.location.href = 'http://localhost:5000/api/auth/google'; 
  };

  return (
    // MAIN BACKGROUND: Subtle radial gradient for depth
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-500 relative overflow-hidden" 
         style={{ 
           backgroundColor: 'var(--bg-primary)',
           backgroundImage: 'radial-gradient(circle at 10% 20%, var(--bg-secondary) 0%, var(--bg-primary) 80%)'
         }}>
      
      {/* BACKGROUND DECORATIONS (Abstract "Sound Waves") */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-20" 
             style={{ backgroundColor: 'var(--accent-color)' }}></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[80px] opacity-10" 
             style={{ backgroundColor: 'var(--visualizer-bottom)' }}></div>
      </div>

      {/* THEME TOGGLE */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className="absolute top-8 right-8 p-3 rounded-full border backdrop-blur-md transition-all z-50 shadow-xl"
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          color: 'var(--text-primary)',
          borderColor: 'var(--border-color)'
        }}
      >
        {themeName === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </motion.button>

      {/* MAIN CONSOLE CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-6xl h-auto md:h-[750px] flex flex-col md:flex-row rounded-[32px] overflow-hidden shadow-2xl border relative z-10"
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          borderColor: 'var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' // Heavy shadow for pop
        }}
      >
        
        {/* --- LEFT SIDE: THE "STUDIO VISUALIZER" (Brand) --- */}
        <div className="hidden md:flex w-[45%] flex-col items-center justify-center p-12 relative overflow-hidden">
          
          {/* Animated Gradient Background */}
          <motion.div 
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 z-0"
            style={{ 
              background: `linear-gradient(135deg, var(--visualizer-top), var(--visualizer-bottom), var(--bg-primary))`,
              backgroundSize: '200% 200%'
            }}
          />

          {/* Glass Overlay for readability */}
          <div className="absolute inset-0 backdrop-blur-[60px] bg-black/10 z-0"></div>

          {/* "ON AIR" Badge */}
          <div className="absolute top-10 left-10 z-20 flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-white text-xs font-bold tracking-widest uppercase">Live Station</span>
          </div>

          {/* Center Content: MASCOT */}
          <div className="relative z-20 flex flex-col items-center text-center">
            
            {/* Floating Mascot */}
            <motion.div 
              animate={{ y: [0, -15, 0] }} // Gentle bobbing animation
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-72 h-72 mb-6 relative drop-shadow-2xl"
            >
               <img 
                 src={radioMascot} 
                 alt="Radio Mascot" 
                 className="w-full h-full object-contain"
               />
            </motion.div>

            <h1 className="text-4xl font-black text-white mb-2 tracking-tight drop-shadow-lg">
              ByteCast Radio
            </h1>
            <p className="text-white/70 text-lg font-medium max-w-xs leading-relaxed">
              Your music, your vibe.<br/> Welcome to the studio.
            </p>
          </div>

          {/* Bottom Stats/Icons */}
          <div className="absolute bottom-10 w-full px-12 flex justify-between text-white/40 z-20">
            <Radio size={24} />
            <div className="flex gap-1 h-6 items-end">
              {[...Array(5)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [10, 24, 10] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                  className="w-1 bg-white/40 rounded-full"
                />
              ))}
            </div>
            <Mic2 size={24} />
          </div>
        </div>

        {/* --- RIGHT SIDE: LOGIN FORM (The Console) --- */}
        <div className="w-full md:w-[55%] p-8 md:p-16 flex flex-col justify-center bg-transparent relative">
          
          <div className="max-w-md mx-auto w-full z-10">
            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Studio Login
              </h2>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Authenticate to manage your shows and playlist.
              </p>
            </div>

            {/* GOOGLE LOGIN */}
            <div className="mb-8">
              <GoogleButton onClick={handleGoogleLogin} />
            </div>

            {/* DIVIDER with Text */}
            <div className="relative flex items-center mb-8">
              <div className="flex-grow border-t" style={{ borderColor: 'var(--border-color)' }}></div>
              <span className="flex-shrink-0 mx-4 text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--text-secondary)' }}>
                Or Console Access
              </span>
              <div className="flex-grow border-t" style={{ borderColor: 'var(--border-color)' }}></div>
            </div>

            {/* FORM */}
            <form onSubmit={handleLogin} className="space-y-6">
              
              <InputField 
                icon={Mail} 
                type="email" 
                name="email"
                placeholder="Station ID / Email" 
                value={formData.email}
                onChange={handleChange}
              />
              
              <div className="space-y-2">
                <InputField 
                  icon={Lock} 
                  type="password" 
                  name="password"
                  placeholder="Console Password" 
                  value={formData.password}
                  onChange={handleChange}
                />
                <div className="flex justify-end pt-1">
                   <button type="button" className="text-xs font-bold hover:underline transition-colors" style={{ color: 'var(--accent-color)' }}>
                    Reset Password?
                  </button>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-white shadow-xl flex items-center justify-center gap-2 transition-all mt-4 relative overflow-hidden group"
                style={{ 
                  background: `linear-gradient(to right, var(--accent-color), var(--accent-hover))`
                }}
              >
                {/* Button Shine Effect */}
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-full transition-all duration-500 ease-in-out" />
                
                {loading ? <Loader2 size={20} className="animate-spin" /> : <>Enter Studio <ArrowRight size={18} /></>}
              </motion.button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Need access? <button className="font-bold hover:underline" style={{ color: 'var(--accent-color)' }}>Contact Station Admin</button>
              </p>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}