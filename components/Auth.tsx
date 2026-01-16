
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onAuth: (user: User) => void;
  isGrayscale: boolean;
}

const Auth: React.FC<AuthProps> = ({ onAuth, isGrayscale }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would hit an API. For now, we simulate success.
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: email,
      name: isLogin ? (email.split('@')[0]) : name,
      isGuest: false,
    };
    // Save "user" to mock a database if signing up
    if (!isLogin) {
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      users.push({ email, password, name });
      localStorage.setItem('mock_users', JSON.stringify(users));
    }
    onAuth(newUser);
  };

  const handleGuest = () => {
    onAuth({
      id: 'guest-' + Date.now(),
      name: 'Guest Santan',
      isGuest: true
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-500 ${isGrayscale ? 'bg-white grayscale' : 'bg-gradient-to-br from-orange-50 to-white'}`}>
      <div className={`w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden transition-all border ${isGrayscale ? 'bg-white border-black' : 'bg-white border-orange-100'}`}>
        <div className={`p-8 sm:p-12 text-center ${isGrayscale ? 'bg-black text-white' : 'bg-orange-600 text-white'}`}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md mb-4 shadow-inner">
            <i className="fa-solid fa-om text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Thakur AI</h2>
          <p className="text-xs opacity-80 uppercase tracking-[0.2em] font-medium mt-1">Ram Narayan Ram</p>
        </div>

        <div className="p-8 sm:p-10">
          <h3 className={`text-xl font-bold mb-6 text-center ${isGrayscale ? 'text-black' : 'text-gray-800'}`}>
            {isLogin ? 'Welcome Back' : 'Join the Sangha'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl text-sm border focus:ring-2 focus:outline-none transition-all ${isGrayscale ? 'border-black focus:ring-black' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-100'}`}
                  placeholder="Enter your name"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl text-sm border focus:ring-2 focus:outline-none transition-all ${isGrayscale ? 'border-black focus:ring-black' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-100'}`}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Secret Key</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl text-sm border focus:ring-2 focus:outline-none transition-all ${isGrayscale ? 'border-black focus:ring-black' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-100'}`}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                isGrayscale ? 'bg-black text-white shadow-black/20' : 'bg-orange-600 text-white shadow-orange-100 hover:bg-orange-700'
              }`}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center space-y-4">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className={`text-xs font-semibold hover:underline ${isGrayscale ? 'text-black' : 'text-orange-600'}`}
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already registered? Login"}
            </button>

            <div className="w-full flex items-center space-x-3">
              <div className="flex-1 h-px bg-gray-100"></div>
              <span className="text-[10px] text-gray-400 font-bold uppercase">or</span>
              <div className="flex-1 h-px bg-gray-100"></div>
            </div>

            <button
              onClick={handleGuest}
              className={`w-full py-3 rounded-xl font-bold text-xs border-2 transition-all ${
                isGrayscale 
                  ? 'border-black text-black hover:bg-black hover:text-white' 
                  : 'border-orange-100 text-orange-600 hover:bg-orange-50 bg-white'
              }`}
            >
              Continue as Guest
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className={`text-[8px] font-bold uppercase tracking-[0.2em] ${isGrayscale ? 'text-black/40' : 'text-gray-400'}`}>
              MADE WITH ❤️️ BY ARPAN PAUL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
