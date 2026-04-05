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
  game: new Chess(),
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  history: [],
  currentMoveIndex: -1,
  evaluation: 0,
  isAnalysisMode: true,
  boardOrientation: 'white',
  accuracyData: [],
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
      // Create a copy of the current game state
      const gameCopy = new Chess(game.fen());

      const result = gameCopy.move(move);
      if (result) {
        // Update the main game instance
        game.load(gameCopy.fen());

        // Update history - remove any moves after current index and add new move
        const newHistory = [...history.slice(0, currentMoveIndex + 1), result];

        set({
          game: gameCopy,
          fen: gameCopy.fen(),
          history: newHistory,
          currentMoveIndex: newHistory.length - 1,
        });
        return true;
      }
    } catch (e) {
      console.error('Move failed:', e);
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
      fen: newGame.fen(),
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
