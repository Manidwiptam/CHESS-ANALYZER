import React, { useState, useEffect } from 'react';
import { useGameStore, MoveClassification } from '../../store/useGameStore';
import { ClayCard, ClayButton } from '../common/ClayUI';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Play, 
  Pause,
  BrainCircuit,
  Target,
  Zap,
  AlertTriangle,
  XCircle,
  BookOpen,
  CheckCircle2,
  Share2,
  History,
  Star,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export const MoveList = () => {
  const { history, currentMoveIndex, jumpToMove, analysisData, setCurrentAnalysisIndex } = useGameStore();

  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      white: history[i],
      black: history[i + 1],
      index: i,
    });
  }

  return (
    <ClayCard className="h-[400px] flex flex-col p-0 overflow-hidden bg-mud/50">
      <div className="p-4 border-b border-deep-brown/10 bg-sand/20 flex items-center justify-between">
        <h3 className="font-serif font-bold text-lg flex items-center gap-2 text-deep-brown">
          <History className="w-5 h-5 text-clay" />
          Move History
        </h3>
        <span className="text-xs font-bold text-deep-brown/40 uppercase tracking-widest">
          {history.length} Moves
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {pairs.map((pair, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2 text-center text-xs font-bold text-deep-brown/30">
              {i + 1}.
            </div>
            <div className="col-span-5">
              <MoveItem 
                move={pair.white} 
                active={currentMoveIndex === pair.index}
                analysis={analysisData[pair.index]}
                onClick={() => {
                  jumpToMove(pair.index);
                  setCurrentAnalysisIndex(pair.index);
                }}
              />
            </div>
            <div className="col-span-5">
              {pair.black && (
                <MoveItem 
                  move={pair.black} 
                  active={currentMoveIndex === pair.index + 1}
                  analysis={analysisData[pair.index + 1]}
                  onClick={() => {
                    jumpToMove(pair.index + 1);
                    setCurrentAnalysisIndex(pair.index + 1);
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-deep-brown/10 bg-sand/10 grid grid-cols-5 gap-2">
        <NavIconButton icon={ChevronsLeft} onClick={() => jumpToMove(-1)} />
        <NavIconButton icon={ChevronLeft} onClick={() => jumpToMove(currentMoveIndex - 1)} />
        <NavIconButton icon={Play} onClick={() => {}} />
        <NavIconButton icon={ChevronRight} onClick={() => jumpToMove(currentMoveIndex + 1)} />
        <NavIconButton icon={ChevronsRight} onClick={() => jumpToMove(history.length - 1)} />
      </div>
    </ClayCard>
  );
};

const MoveItem = ({ move, active, analysis, onClick }: { move: any; active: boolean; analysis?: any; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between group ${
        active ? 'bg-clay text-white shadow-lg' : 'hover:bg-sand/40 text-deep-brown'
      }`}
    >
      <span className="font-bold text-sm">{move.san}</span>
      {analysis && <ClassificationIcon classification={analysis.classification} size={14} />}
    </button>
  );
};

const NavIconButton = ({ icon: Icon, onClick }: { icon: any; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="p-2 rounded-xl clay-inset bg-white/40 hover:bg-sand/50 transition-all flex items-center justify-center text-deep-brown/60 hover:text-clay"
  >
    <Icon className="w-5 h-5" />
  </button>
);

export const AnalysisInsights = () => {
  const { history, currentMoveIndex, evaluation, accuracyData, analysisData, getMoveExplanation, currentAnalysisIndex } = useGameStore();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  const currentMove = history[currentMoveIndex];
  const currentAnalysis = analysisData[currentAnalysisIndex];

  useEffect(() => {
    if (currentMoveIndex >= 0 && currentAnalysis) {
      setIsLoadingExplanation(true);
      getMoveExplanation(currentMoveIndex).then((exp) => {
        setExplanation(exp);
        setIsLoadingExplanation(false);
      });
    } else {
      setExplanation(null);
    }
  }, [currentMoveIndex, currentAnalysis, getMoveExplanation]);

  if (!currentMove) return (
    <ClayCard className="flex flex-col items-center justify-center p-12 text-center space-y-4 bg-mud/30">
      <div className="p-6 clay-inset bg-white/40 rounded-full animate-pulse">
        <BrainCircuit className="w-12 h-12 text-clay/30" />
      </div>
      <p className="text-deep-brown/40 font-serif italic">Select a move to see AI insights</p>
    </ClayCard>
  );

  return (
    <div className="space-y-6">
      {/* AI Coach Avatar Section */}
      <ClayCard className="relative overflow-visible pt-12 bg-mud/30">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-2xl clay-card p-1 bg-white overflow-hidden border-4 border-clay/20">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=E8C1A0" 
            alt="AI Coach" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="text-center space-y-4">
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-xl text-deep-brown">Mitti AI Coach</h3>
            <div className="flex items-center justify-center gap-2">
              {currentAnalysis && <ClassificationIcon classification={currentAnalysis.classification} />}
              <span className={`text-sm font-bold uppercase tracking-widest ${getClassificationColor(currentAnalysis?.classification || 'Good')}`}>
                {currentMove.san} is {currentAnalysis?.classification?.toLowerCase() || 'a solid move'}
              </span>
            </div>
            {currentAnalysis && (
              <div className="text-xs text-deep-brown/60">
                Best move: {currentAnalysis.best_move} | Eval: {currentAnalysis.eval > 0 ? '+' : ''}{(currentAnalysis.eval / 100).toFixed(1)}
              </div>
            )}
          </div>

          <div className="relative p-4 clay-inset bg-white/60 rounded-2xl text-deep-brown/80 text-sm leading-relaxed italic min-h-[60px] flex items-center justify-center">
            {isLoadingExplanation ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-clay/30 border-t-clay rounded-full animate-spin" />
                <span>Analyzing move...</span>
              </div>
            ) : explanation ? (
              <div className="text-left">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/60 rotate-45 border-t border-l border-deep-brown/5" />
                {explanation}
              </div>
            ) : (
              "Click 'Get Explanation' to understand this move better."
            )}
          </div>

          <div className="flex gap-3">
            <ClayButton
              onClick={() => {
                setIsLoadingExplanation(true);
                getMoveExplanation(currentMoveIndex).then((exp) => {
                  setExplanation(exp);
                  setIsLoadingExplanation(false);
                });
              }}
              disabled={isLoadingExplanation}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {isLoadingExplanation ? 'Analyzing...' : 'Get Explanation'}
            </ClayButton>
            <ClayButton className="flex-1 flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </ClayButton>
            <ClayButton variant="inset" className="p-2">
              <ChevronRight className="w-6 h-6" />
            </ClayButton>
          </div>
        </div>
      </ClayCard>

      {/* Accuracy Graph */}
      <ClayCard className="p-0 overflow-hidden bg-mud/30">
        <div className="p-4 border-b border-deep-brown/10 bg-sand/20 flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg flex items-center gap-2 text-deep-brown">
            <Target className="w-5 h-5 text-clay" />
            Game Accuracy
          </h3>
        </div>
        <div className="h-[200px] w-full p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={accuracyData}>
              <defs>
                <linearGradient id="colorEval" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C97B63" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C97B63" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#6B422610" />
              <XAxis dataKey="move" hide />
              <YAxis hide domain={[-5, 5]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#F5E9DC', 
                  borderRadius: '12px', 
                  border: 'none',
                  boxShadow: 'var(--shadow-clay-card)'
                }}
              />
              <ReferenceLine y={0} stroke="#6B422620" />
              <Area 
                type="monotone" 
                dataKey="eval" 
                stroke="#C97B63" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEval)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ClayCard>
    </div>
  );
};

const ClassificationIcon = ({ classification, size = 18 }: { classification: MoveClassification; size?: number }) => {
  const icons = {
    'Best': { icon: Star, color: 'text-emerald-500' },
    'Excellent': { icon: CheckCircle2, color: 'text-emerald-400' },
    'Good': { icon: CheckCircle2, color: 'text-blue-400' },
    'Inaccuracy': { icon: AlertTriangle, color: 'text-yellow-500' },
    'Mistake': { icon: AlertTriangle, color: 'text-orange-500' },
    'Blunder': { icon: XCircle, color: 'text-red-500' },
    'Book': { icon: BookOpen, color: 'text-clay' },
  };

  const { icon: Icon, color } = icons[classification] || icons['Good'];
  return <Icon className={`${color}`} size={size} />;
};

const getClassificationColor = (classification?: MoveClassification) => {
  const colors = {
    'Best': 'text-emerald-500',
    'Excellent': 'text-emerald-400',
    'Good': 'text-blue-400',
    'Inaccuracy': 'text-yellow-500',
    'Mistake': 'text-orange-500',
    'Blunder': 'text-red-500',
    'Book': 'text-clay',
  };
  return classification ? colors[classification] : 'text-deep-brown/40';
};
