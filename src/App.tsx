import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/Landing';
import { AnalysisPage, EditorPage } from './pages/AppPages';
import { ClayButton } from './components/common/ClayUI';
import { 
  Trophy, 
  BrainCircuit, 
  Layout, 
  Menu, 
  X, 
  User as UserIcon, 
  Settings, 
  Search, 
  History,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            role: 'user',
            createdAt: Timestamp.now()
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentPage('landing');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-mud flex items-center justify-center">
        <div className="p-8 clay-card animate-pulse">
          <Trophy className="w-12 h-12 text-clay" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans selection:bg-clay/30 overflow-x-hidden">
      <div className="grain-overlay" />
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => setCurrentPage('landing')}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="p-2 clay-inset bg-white/40 rounded-xl group-hover:bg-sand/30 transition-all">
              <Trophy className="w-6 h-6 text-clay" />
            </div>
            <span className="text-2xl font-serif font-bold text-deep-brown tracking-tighter">Analyzer.</span>
          </button>

          <div className="hidden md:flex items-center gap-6 bg-mud/40 backdrop-blur-md px-6 py-2 rounded-2xl clay-inset">
            <NavButton active={currentPage === 'analysis'} onClick={() => setCurrentPage('analysis')}>Analysis</NavButton>
            <NavButton active={currentPage === 'editor'} onClick={() => setCurrentPage('editor')}>Editor</NavButton>
            {user && <NavButton active={currentPage === 'history'} onClick={() => {}}>History</NavButton>}
          </div>

          <div className="flex items-center gap-3">
            <ClayButton className="p-2 rounded-xl hidden md:flex">
              <Search className="w-5 h-5" />
            </ClayButton>
            
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl clay-inset overflow-hidden border-2 border-white/40">
                  <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-full h-full object-cover" />
                </div>
                <ClayButton onClick={handleLogout} className="p-2 rounded-xl" title="Logout">
                  <LogOut className="w-5 h-5" />
                </ClayButton>
              </div>
            ) : (
              <ClayButton onClick={handleLogin} className="flex items-center gap-2 px-4 py-2" variant="primary">
                <LogIn className="w-5 h-5" />
                Login
              </ClayButton>
            )}

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 clay-inset bg-white/40 rounded-xl"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-mud/95 backdrop-blur-xl p-6 pt-24 md:hidden"
          >
            <div className="flex flex-col gap-4">
              <MobileNavButton onClick={() => { setCurrentPage('analysis'); setIsMenuOpen(false); }}>Analysis</MobileNavButton>
              <MobileNavButton onClick={() => { setCurrentPage('editor'); setIsMenuOpen(false); }}>Editor</MobileNavButton>
              {user && <MobileNavButton onClick={() => setIsMenuOpen(false)}>History</MobileNavButton>}
              <MobileNavButton onClick={() => setIsMenuOpen(false)}>Settings</MobileNavButton>
              {user ? (
                <MobileNavButton onClick={() => { handleLogout(); setIsMenuOpen(false); }}>Logout</MobileNavButton>
              ) : (
                <MobileNavButton onClick={() => { handleLogin(); setIsMenuOpen(false); }}>Login</MobileNavButton>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-24 pb-12">
        <AnimatePresence mode="wait">
          {currentPage === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <LandingPage onNavigate={setCurrentPage} />
            </motion.div>
          )}
          {currentPage === 'analysis' && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <AnalysisPage />
            </motion.div>
          )}
          {currentPage === 'editor' && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <EditorPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-deep-brown/10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-clay" />
            <span className="font-serif font-bold text-xl text-deep-brown">Chess Analyzer</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-deep-brown/40">
            <a href="#" className="hover:text-clay transition-colors">About</a>
            <a href="#" className="hover:text-clay transition-colors">Privacy</a>
            <a href="#" className="hover:text-clay transition-colors">Terms</a>
            <a href="#" className="hover:text-clay transition-colors">Support</a>
          </div>
          <div className="text-sm text-deep-brown/30">
            © 2026 Chess Analyzer. Handcrafted with Clay.
          </div>
        </div>
      </footer>
    </div>
  );
}

const NavButton = ({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`text-sm font-bold transition-all px-4 py-1.5 rounded-xl ${
      active ? 'bg-clay text-white shadow-lg' : 'text-deep-brown/60 hover:text-deep-brown'
    }`}
  >
    {children}
  </button>
);

const MobileNavButton = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="text-2xl font-serif font-bold text-deep-brown p-4 clay-card text-left"
  >
    {children}
  </button>
);
