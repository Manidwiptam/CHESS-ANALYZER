import { Chess, Move } from 'chess.js';
import { create } from 'zustand';

export type MoveClassification = 'Best' | 'Excellent' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder' | 'Book';

export interface AnalysisMove extends Partial<Move> {
  classification?: MoveClassification;
  explanation?: string;
  eval?: number;
  bestMove?: string;
}

interface GameState {
  game: Chess;
  fen: string;
  history: AnalysisMove[];
  currentMoveIndex: number;
  evaluation: number; // centipawns
  isAnalysisMode: boolean;
  boardOrientation: 'white' | 'black';
  accuracyData: { move: number; eval: number }[];
  editorState: {
    turn: 'w' | 'b';
    castling: { w: { k: boolean; q: boolean }; b: { k: boolean; q: boolean } };
    enPassant: string;
  };
  
  // Actions
  setFen: (fen: string) => void;
  loadPgn: (pgn: string) => boolean;
  makeMove: (move: string | { from: string; to: string; promotion?: string }) => boolean;
  undoMove: () => void;
  resetGame: () => void;
  clearBoard: () => void;
  jumpToMove: (index: number) => void;
  toggleAnalysisMode: (val: boolean) => void;
  flipBoard: () => void;
  setEditorState: (state: Partial<GameState['editorState']>) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  game: new Chess('r1bqkbnr/1ppp1ppp/p1B5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4'),
  fen: 'r1bqkbnr/1ppp1ppp/p1B5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4',
  history: [
    { san: 'e4', classification: 'Book', explanation: 'The King\'s Pawn Opening is the most popular first move for white.' },
    { san: 'e5', classification: 'Book', explanation: 'The Open Game is a solid response to e4.' },
    { san: 'Nf3', classification: 'Best', explanation: 'Developing the knight and attacking the pawn on e5.' },
    { san: 'Nc6', classification: 'Excellent', explanation: 'Developing the knight and defending e5.' },
    { san: 'Bb5', classification: 'Book', explanation: 'The Ruy Lopez is one of the most studied openings in chess.' },
    { san: 'a6', classification: 'Good', explanation: 'The Morphy Defense, challenging the bishop immediately.' },
    { san: 'Bxc6', classification: 'Inaccuracy', explanation: 'The Exchange Variation is playable but gives up the bishop pair early.' },
  ],
  currentMoveIndex: 6,
  evaluation: 40,
  isAnalysisMode: true,
  boardOrientation: 'white',
  accuracyData: Array.from({ length: 20 }, (_, i) => ({
    move: i + 1,
    eval: Math.sin(i / 2) * 2 + (Math.random() - 0.5),
  })),
  editorState: {
    turn: 'w',
    castling: { w: { k: true, q: true }, b: { k: true, q: true } },
    enPassant: '-',
  },

  setEditorState: (newState) => set((state) => ({
    editorState: { ...state.editorState, ...newState }
  })),

  setFen: (fen) => {
    if (!fen || fen.trim() === '') {
      console.warn('Ignored empty FEN string');
      return;
    }

    try {
      const newGame = new Chess(fen);
      set({ game: newGame, fen: newGame.fen(), history: [], currentMoveIndex: -1 });
    } catch (e) {
      console.error('Invalid FEN');
    }
  },

  loadPgn: (pgn) => {
    try {
      const newGame = new Chess();
      newGame.loadPgn(pgn);
      set({ 
        game: newGame, 
        fen: newGame.fen(), 
        history: newGame.history({ verbose: true }), 
        currentMoveIndex: newGame.history().length - 1 
      });
      return true;
    } catch (e) {
      console.error('Invalid PGN');
      return false;
    }
  },

  makeMove: (move) => {
    const { game, history, currentMoveIndex } = get();
    try {
      const result = game.move(move);
      if (result) {
        const newHistory = [...history.slice(0, currentMoveIndex + 1), result];
        set({
          game: new Chess(game.fen()),
          fen: game.fen(),
          history: newHistory,
          currentMoveIndex: newHistory.length - 1,
        });
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  },

  undoMove: () => {
    const { history, currentMoveIndex } = get();
    if (currentMoveIndex >= 0) {
      const newIndex = currentMoveIndex - 1;
      const newGame = new Chess();
      for (let i = 0; i <= newIndex; i++) {
        newGame.move(history[i] as any);
      }
      set({
        game: newGame,
        fen: newGame.fen(),
        currentMoveIndex: newIndex,
      });
    }
  },

  resetGame: () => {
    const newGame = new Chess();
    set({
      game: newGame,
      fen: 'start',
      history: [],
      currentMoveIndex: -1,
      evaluation: 0,
    });
  },

  clearBoard: () => {
    const newGame = new Chess();
    newGame.clear();
    set({
      game: newGame,
      fen: newGame.fen(),
      history: [],
      currentMoveIndex: -1,
      evaluation: 0,
    });
  },

  jumpToMove: (index) => {
    const { history } = get();
    const newGame = new Chess();
    for (let i = 0; i <= index; i++) {
      newGame.move(history[i] as any);
    }
    set({
      game: newGame,
      fen: newGame.fen(),
      currentMoveIndex: index,
    });
  },

  toggleAnalysisMode: (val) => set({ isAnalysisMode: val }),

  flipBoard: () => set((state) => ({ 
    boardOrientation: state.boardOrientation === 'white' ? 'black' : 'white' 
  })),
}));
