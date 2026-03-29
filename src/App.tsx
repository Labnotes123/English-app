/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LiveSession } from "./components/LiveSession";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans text-slate-900 selection:bg-blue-200">
      <header className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <span className="text-white font-black text-xl">E</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">
            English <span className="text-blue-600">Buddy</span>
          </h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500 uppercase tracking-widest">
          <a href="#" className="hover:text-blue-600 transition-colors">Practice</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Topics</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Progress</a>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-20">
        <LiveSession />
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-200/50 text-center">
        <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
          Powered by Gemini 3.1 Flash Live • Built for English Learners
        </p>
      </footer>
    </div>
  );
}

