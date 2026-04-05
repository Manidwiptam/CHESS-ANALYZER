import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../../store/useGameStore';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, MousePointer2 } from 'lucide-react';

export const Board = ({ 
  onMove, 
  boardWidth = 560, 
  isEditor = false 
}: { 
  onMove?: (move: any) => void; 
  boardWidth?: number;
  isEditor?: boolean;
}) => {
  const { game, makeMove, fen, boardOrientation, setFen, editorState, setEditorState } = useGameStore();
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (isEditor) {
      const piece = game.get(sourceSquare as any);
      if (piece) {
        game.remove(sourceSquare as any);
        game.put(piece, targetSquare as any);
        setFen(game.fen());
        return true;
      }
      return false;
    }

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    };

    const result = makeMove(move);
    if (result && onMove) onMove(move);
    return result;
  }

  function onSquareClick(square: string) {
    if (isEditor) {
      if (selectedPiece === 'trash') {
        game.remove(square as any);
      } else if (selectedPiece) {
        const color = selectedPiece[0] === 'w' ? 'w' : 'b';
        const type = selectedPiece[1].toLowerCase() as any;
        game.put({ type, color }, square as any);
      } else {
        game.remove(square as any);
      }
      setFen(game.fen());
    }
  }

  const ChessboardAny = Chessboard as any;

  return (
    <div className="space-y-6">
      <div className="relative p-4 clay-card bg-[#6B4226]/5">
        <div className="rounded-2xl overflow-hidden shadow-2xl border-8 border-[#6B4226]/10">
          <ChessboardAny 
            position={fen} 
            onPieceDrop={onDrop} 
            onSquareClick={onSquareClick}
            boardWidth={boardWidth}
            boardOrientation={boardOrientation}
            showBoardCoordinates={true}
            customDarkSquareStyle={{ backgroundColor: '#B07058' }}
            customLightSquareStyle={{ backgroundColor: '#E8C1A0' }}
            animationDuration={300}
          />
        </div>
      </div>

      {isEditor && (
        <div className="clay-card p-6 space-y-6">
          <div className="grid grid-cols-6 gap-2">
            {['wP', 'wN', 'wB', 'wR', 'wQ', 'wK'].map((piece) => (
              <PieceButton 
                key={piece} 
                piece={piece} 
                isSelected={selectedPiece === piece} 
                onClick={() => setSelectedPiece(piece)} 
              />
            ))}
            {['bP', 'bN', 'bB', 'bR', 'bQ', 'bK'].map((piece) => (
              <PieceButton 
                key={piece} 
                piece={piece} 
                isSelected={selectedPiece === piece} 
                onClick={() => setSelectedPiece(piece)} 
              />
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-deep-brown/10">
            <button
              onClick={() => setSelectedPiece('trash')}
              className={`p-3 rounded-xl transition-all flex items-center gap-2 ${
                selectedPiece === 'trash' ? 'bg-red-500 text-white shadow-lg' : 'bg-red-50 text-red-500 hover:bg-red-100'
              }`}
              title="Remove piece"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Remove</span>
            </button>
            <button
              onClick={() => setSelectedPiece(null)}
              className={`p-3 rounded-xl transition-all flex items-center gap-2 ${
                selectedPiece === null ? 'bg-clay text-white shadow-lg' : 'bg-sand/30 text-clay hover:bg-sand/50'
              }`}
              title="Select/Move"
            >
              <MousePointer2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Move</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface PieceButtonProps {
  key?: string;
  piece: string;
  isSelected: boolean;
  onClick: () => void;
}

const PieceButton = ({ piece, isSelected, onClick }: PieceButtonProps) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-xl transition-all flex items-center justify-center ${
      isSelected ? 'bg-clay shadow-inner scale-110' : 'hover:bg-sand/30'
    }`}
  >
    <img 
      src={`https://chessboardjs.com/img/chesspieces/wikipedia/${piece}.png`} 
      alt={piece} 
      className="w-10 h-10"
      referrerPolicy="no-referrer"
    />
  </button>
);

export const EvalBar = ({ evaluation }: { evaluation: number }) => {
  // evaluation is in centipawns. 0 is equal, positive is white advantage.
  // Normalize to percentage (e.g., +1000 is 100% white, -1000 is 100% black)
  const clampedEval = Math.max(-10, Math.min(10, evaluation / 100));
  const percentage = 50 + (clampedEval * 5); // 0 eval = 50%

  return (
    <div className="w-4 h-full clay-inset overflow-hidden flex flex-col-reverse relative">
      <motion.div 
        initial={{ height: '50%' }}
        animate={{ height: `${percentage}%` }}
        className="bg-white w-full absolute bottom-0 left-0 transition-all duration-500 ease-out"
      />
      <div className="absolute top-2 left-0 w-full text-[8px] font-bold text-center text-deep-brown/50">
        {evaluation > 0 ? `+${(evaluation/100).toFixed(1)}` : (evaluation/100).toFixed(1)}
      </div>
    </div>
  );
};
