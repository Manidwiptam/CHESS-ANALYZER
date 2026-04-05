import React, { useState } from 'react';
import { Board, EvalBar } from '../components/chess/Board';
import { MoveList, AnalysisInsights } from '../components/chess/AnalysisPanel';
import { ClayCard, ClayButton, ClayInput } from '../components/common/ClayUI';
import { useGameStore } from '../store/useGameStore';
import { 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Share2, 
  Download, 
  Trophy, 
  BrainCircuit, 
  History, 
  Layout, 
  Search, 
  User, 
  Menu, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Star 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AnalysisPage = () => {
  const { evaluation, history, currentMoveIndex, resetGame, loadPgn, flipBoard, undoMove } = useGameStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [pgnInput, setPgnInput] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const handlePgnUpload = () => {
    if (loadPgn(pgnInput)) {
      setShowUpload(false);
      setPgnInput('');
    }
  };

  const handleExportPgn = () => {
    const pgn = useGameStore.getState().game.pgn();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-analyzer-${new Date().toISOString()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 clay-inset bg-white/40 rounded-2xl">
            <BrainCircuit className="w-6 h-6 text-clay" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-deep-brown">Game Review</h1>
            <p className="text-sm text-deep-brown/50 italic">AI-powered move analysis & strategic insights</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <ClayButton onClick={() => setShowUpload(true)} variant="primary" className="flex items-center gap-2 px-4 py-2">
            <Upload className="w-4 h-4" />
            Upload PGN
          </ClayButton>
          <ClayButton onClick={handleExportPgn} className="flex items-center gap-2 px-4 py-2">
            <Download className="w-4 h-4" />
            Export
          </ClayButton>
        </div>
      </div>

      <AnimatePresence>
        {showUpload && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-deep-brown/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg clay-card p-8 space-y-6 bg-mud"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-serif font-bold text-deep-brown">Import Game</h3>
                <button onClick={() => setShowUpload(false)} className="p-2 hover:bg-sand/20 rounded-full transition-all">
                  <X className="w-6 h-6 text-deep-brown/40" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-deep-brown/40">Paste PGN or Move List</label>
                  <textarea 
                    value={pgnInput}
                    onChange={(e) => setPgnInput(e.target.value)}
                    className="w-full h-48 p-4 clay-inset bg-white/60 rounded-2xl focus:outline-none focus:ring-2 ring-clay/20 text-sm font-mono"
                    placeholder="[Event 'Casual Game']\n1. e4 e5 2. Nf3 Nc6..."
                  />
                </div>
                <div className="flex gap-4">
                  <ClayButton onClick={() => setShowUpload(false)} className="flex-1">Cancel</ClayButton>
                  <ClayButton onClick={handlePgnUpload} variant="primary" className="flex-1">Start Analysis</ClayButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Board & Eval */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex gap-6">
            <EvalBar evaluation={evaluation} />
            <div className="flex-1">
              <Board boardWidth={640} />
            </div>
          </div>

          {/* Analysis Controls */}
          <ClayCard className="flex items-center justify-between p-4 bg-mud/40">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 clay-inset bg-white/40 rounded-xl">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-deep-brown/60">Engine Ready</span>
              </div>
              <div className="text-sm font-mono font-bold text-clay">Depth: 24</div>
            </div>
            
            <div className="flex items-center gap-2">
              <ClayButton onClick={resetGame} variant="inset" className="p-2 rounded-xl" title="Reset">
                <RotateCcw className="w-5 h-5" />
              </ClayButton>
              <ClayButton onClick={undoMove} variant="inset" className="p-2 rounded-xl" title="Undo">
                <History className="w-5 h-5" />
              </ClayButton>
              <ClayButton onClick={flipBoard} variant="inset" className="p-2 rounded-xl" title="Flip Board">
                <Layout className="w-5 h-5" />
              </ClayButton>
              <ClayButton variant="inset" className="p-2 rounded-xl">
                <Settings className="w-5 h-5" />
              </ClayButton>
            </div>
          </ClayCard>
        </div>

        {/* Right: Sidebar */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          <div className="flex gap-2 p-1 clay-inset bg-mud/50 rounded-2xl">
            {['overview', 'mistakes', 'learn'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold capitalize transition-all ${
                  activeTab === tab 
                    ? 'bg-clay text-white shadow-lg' 
                    : 'text-deep-brown/50 hover:text-deep-brown'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col gap-6"
              >
                <AnalysisInsights />
                <MoveList />
              </motion.div>
            )}
            {activeTab === 'mistakes' && (
               <motion.div 
                key="mistakes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 space-y-4"
              >
                <ClayCard className="p-6 bg-rose-50/50 border-rose-100">
                  <h4 className="font-bold text-rose-700 mb-2">Critical Mistakes</h4>
                  <p className="text-sm text-rose-600/80">You missed a winning tactic at move 24. Let's review it.</p>
                </ClayCard>
                <div className="space-y-2">
                   {[14, 24, 32].map(move => (
                     <div key={move} className="flex items-center justify-between p-4 clay-card bg-white/40">
                        <div className="flex items-center gap-3">
                          <XCircle className="w-5 h-5 text-rose-500" />
                          <span className="font-bold">Move {move}: Blunder</span>
                        </div>
                        <ClayButton className="text-xs py-1 px-3">Review</ClayButton>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export const EditorPage = () => {
  const { setFen, resetGame, clearBoard, flipBoard, fen, editorState, setEditorState } = useGameStore();
  const [fenInput, setFenInput] = useState('');

  const handlePlayEngine = () => {
    const moves = useGameStore.getState().game.moves();
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      useGameStore.getState().makeMove(randomMove);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 clay-inset bg-white/40 rounded-2xl">
            <Layout className="w-6 h-6 text-clay" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-deep-brown">Board Editor</h1>
            <p className="text-sm text-deep-brown/50">Setup custom positions and export FEN/PGN</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <Board boardWidth={640} isEditor />
        </div>

        <div className="lg:col-span-5 space-y-8">
          <ClayCard className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-xl">Position Settings</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-deep-brown/40">Side to Move</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditorState({ turn: 'w' })}
                    className={`flex-1 p-2 rounded-xl border-2 transition-all ${editorState.turn === 'w' ? 'border-clay bg-clay/10' : 'border-transparent bg-sand/20'}`}
                  >
                    White to play
                  </button>
                  <button 
                    onClick={() => setEditorState({ turn: 'b' })}
                    className={`flex-1 p-2 rounded-xl border-2 transition-all ${editorState.turn === 'b' ? 'border-clay bg-clay/10' : 'border-transparent bg-sand/20'}`}
                  >
                    Black to play
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-deep-brown/40">Castling Rights</label>
                <div className="grid grid-cols-2 gap-4 p-4 clay-inset bg-white/40 rounded-2xl">
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-deep-brown/40 uppercase">White</div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editorState.castling.w.k} onChange={(e) => setEditorState({ castling: { ...editorState.castling, w: { ...editorState.castling.w, k: e.target.checked } } })} /> O-O
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editorState.castling.w.q} onChange={(e) => setEditorState({ castling: { ...editorState.castling, w: { ...editorState.castling.w, q: e.target.checked } } })} /> O-O-O
                    </label>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-deep-brown/40 uppercase">Black</div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editorState.castling.b.k} onChange={(e) => setEditorState({ castling: { ...editorState.castling, b: { ...editorState.castling.b, k: e.target.checked } } })} /> O-O
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editorState.castling.b.q} onChange={(e) => setEditorState({ castling: { ...editorState.castling, b: { ...editorState.castling.b, q: e.target.checked } } })} /> O-O-O
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-deep-brown/40">FEN String</label>
                <div className="flex gap-2">
                  <ClayInput 
                    value={fenInput || fen} 
                    onChange={(e) => setFenInput(e.target.value)}
                    placeholder="FEN string..." 
                  />
                  <ClayButton onClick={() => setFen(fenInput)} variant="primary">Load</ClayButton>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-deep-brown/10">
              <ClayButton onClick={resetGame} className="flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Starting Pos
              </ClayButton>
              <ClayButton onClick={clearBoard} className="flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                Clear Board
              </ClayButton>
              <ClayButton onClick={flipBoard} className="flex items-center justify-center gap-2">
                <Layout className="w-4 h-4" />
                Flip Board
              </ClayButton>
              <ClayButton onClick={handlePlayEngine} variant="primary" className="flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Play Engine
              </ClayButton>
            </div>
          </ClayCard>
        </div>
      </div>
    </div>
  );
};
