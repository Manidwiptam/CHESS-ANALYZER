import React from 'react';
import { motion } from 'motion/react';
import { ClayCard, ClayButton } from '../components/common/ClayUI';
import { 
  Trophy, 
  BrainCircuit, 
  Layout, 
  ChevronRight, 
  Play, 
  Search, 
  History, 
  Settings, 
  User, 
  Menu, 
  X 
} from 'lucide-react';

export const LandingPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-12 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-center gap-12 w-full">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 clay-inset bg-white/40 rounded-full">
            <Trophy className="w-4 h-4 text-clay" />
            <span className="text-xs font-bold uppercase tracking-widest text-clay">Premium Chess Platform</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-serif font-bold text-deep-brown leading-[0.9] tracking-tighter">
            Chess <br />
            <span className="text-clay italic">Analyzer.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-deep-brown/70 leading-relaxed max-w-md">
            Experience chess with a handcrafted Indian claymorphism aesthetic. 
            Analyze your games with AI and master the board.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <ClayButton 
              variant="primary" 
              onClick={() => onNavigate('analysis')}
              className="flex items-center gap-2 group"
            >
              Analyze Your Game
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </ClayButton>
            
            <ClayButton 
              onClick={() => onNavigate('editor')}
              className="flex items-center gap-2"
            >
              <Layout className="w-5 h-5" />
              Board Editor
            </ClayButton>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex-1 relative"
        >
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-clay/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-sand/20 rounded-full blur-3xl" />
          
          <ClayCard className="p-2 bg-white/10 border-white/20 backdrop-blur-sm">
             <img 
              src="https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=2071&auto=format&fit=crop" 
              alt="Chess Board" 
              className="rounded-2xl shadow-2xl grayscale-[0.3] sepia-[0.2] hover:sepia-0 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="p-6 rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-2xl animate-pulse">
                <Play className="w-12 h-12 text-white fill-white" />
              </div>
            </div>
          </ClayCard>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pt-12">
        <FeatureCard 
          icon={<BrainCircuit className="w-8 h-8 text-clay" />}
          title="AI Analysis"
          description="Deep engine insights with move classifications and strategic explanations."
        />
        <FeatureCard 
          icon={<Layout className="w-8 h-8 text-clay" />}
          title="Custom Editor"
          description="Setup any position, import FEN/PGN, and play against the engine."
        />
        <FeatureCard 
          icon={<History className="w-8 h-8 text-clay" />}
          title="Game Review"
          description="Import your games from Chess.com or Lichess and find your mistakes."
        />
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <ClayCard className="p-8 space-y-4 hover:translate-y-[-8px] transition-all duration-300 group">
    <div className="p-4 rounded-2xl clay-inset w-fit group-hover:bg-sand/20 transition-all">
      {icon}
    </div>
    <h3 className="text-2xl font-serif font-bold text-deep-brown">{title}</h3>
    <p className="text-deep-brown/60 leading-relaxed">{description}</p>
  </ClayCard>
);
