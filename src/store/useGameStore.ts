import { Chess, Move } from 'chess.js';
import { create } from 'zustand';

export type MoveClassification = 'Best' | 'Excellent' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder' | 'Book';

export interface AnalysisMove extends Partial<Move> {
  classification?: MoveClassification;
  explanation?: string;
  eval?: number;
  bestMove?: string;
  uci?: string;
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

  // Analysis state
  isAnalyzing: boolean;
  analysisData: AnalysisMove[];
  currentAnalysisIndex: number;

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

  // Analysis actions
  analyzeGame: (pgn: string) => Promise<boolean>;
  getMoveExplanation: (moveIndex: number) => Promise<string | null>;
  setCurrentAnalysisIndex: (index: number) => void;
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

  // Analysis state
  isAnalyzing: false,
  analysisData: [],
  currentAnalysisIndex: -1,

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

  // Analysis methods
  analyzeGame: async (pgn: string) => {
    set({ isAnalyzing: true });
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      console.log('🔍 Making API call to:', `${apiUrl}/analyze`);
      console.log('📄 PGN being sent:', pgn.substring(0, 100) + '...');

      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pgn }),
      });

      console.log('📊 API Response status:', response.status);
      console.log('📋 API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Analysis failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API Response data:', data);

      // Load the game from PGN
      const game = new Chess();
      game.loadPgn(pgn);

      // Create history with analysis data
      const history: AnalysisMove[] = [];
      const moves = game.history({ verbose: true });

      moves.forEach((move, index) => {
        const analysis = data.moves[index];
        if (analysis) {
          history.push({
            ...move,
            classification: analysis.classification as MoveClassification,
            eval: analysis.eval,
            bestMove: analysis.best_move,
            uci: analysis.move,
          });
        } else {
          history.push(move);
        }
      });

      set({
        game,
        fen: game.fen(),
        history,
        currentMoveIndex: history.length - 1,
        analysisData: data.moves,
        currentAnalysisIndex: data.moves.length - 1,
        isAnalyzing: false,
      });

      return true;
    } catch (error) {
      console.error('Analysis error:', error);
      set({ isAnalyzing: false });
      return false;
    }
  },

  getMoveExplanation: async (moveIndex: number) => {
    const { analysisData, history } = get();
    const analysis = analysisData[moveIndex];
    const move = history[moveIndex];

    if (!analysis || !move) return null;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      console.log('🔍 Making explanation API call to:', `${apiUrl}/explain`);

      // Get FEN before the move
      const tempGame = new Chess();
      for (let i = 0; i < moveIndex; i++) {
        tempGame.move(history[i] as any);
      }
      const fen = tempGame.fen();
      console.log('📋 FEN being sent:', fen);
      console.log('♟️ Move data:', { move: analysis.move, best_move: analysis.best_move });

      const response = await fetch(`${apiUrl}/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          move: analysis.move,
          best_move: analysis.best_move,
          fen: fen,
        }),
      });

      console.log('📊 Explanation API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Explanation API Error:', errorText);
        throw new Error(`Explanation failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Explanation API Response:', data);
      console.log('Explanation API Response:', data);
      return data.explanation;
    } catch (error) {
      console.error('Explanation error:', error);
      return null;
    }
  },

  setCurrentAnalysisIndex: (index) => set({ currentAnalysisIndex: index }),
}));
