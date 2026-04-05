from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import chess
import chess.pgn
import stockfish
import openai
import os
import io
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Chess Analysis API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Stockfish with fallback paths
STOCKFISH_PATHS = [
    "/usr/bin/stockfish",  # Linux production
    "/usr/local/bin/stockfish",  # macOS/Homebrew
    "stockfish",  # System PATH
    "/app/stockfish",  # Railway/Docker
    "/opt/homebrew/bin/stockfish",  # macOS ARM
    "C:\\Program Files\\stockfish\\stockfish.exe",  # Windows
    "C:\\stockfish\\stockfish.exe",  # Windows alternative
]

stockfish_engine = None
for path in STOCKFISH_PATHS:
    try:
        print(f"Trying Stockfish path: {path}")
        stockfish_engine = stockfish.Stockfish(path=path)
        stockfish_engine.set_depth(10)  # Reduced for production performance
        stockfish_engine.set_skill_level(20)  # Max skill

        # Test the engine
        test_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        stockfish_engine.set_fen_position(test_fen)
        best_move = stockfish_engine.get_best_move()
        print(f"Stockfish initialized successfully at {path}, test move: {best_move}")
        break
    except Exception as e:
        print(f"Failed to initialize Stockfish at {path}: {e}")
        continue

if stockfish_engine is None:
    print("WARNING: Could not initialize Stockfish engine!")
    print("The application will run in demo mode with limited functionality.")
    print("For full functionality, please install Stockfish chess engine.")

# Initialize OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Pydantic models
class AnalysisRequest(BaseModel):
    pgn: str

class ExplainRequest(BaseModel):
    move: str
    best_move: str
    fen: str

class MoveAnalysis(BaseModel):
    move: str
    best_move: str
    eval: float  # centipawns
    classification: str
    explanation: Optional[str] = None

class AnalysisResponse(BaseModel):
    moves: List[MoveAnalysis]
    final_fen: str

class ExplainResponse(BaseModel):
    explanation: str

def get_move_classification(eval_diff: float) -> str:
    """Classify move quality based on evaluation difference in centipawns"""
    abs_diff = abs(eval_diff)

    if abs_diff < 20:
        return "Best"
    elif abs_diff < 50:
        return "Excellent"
    elif abs_diff < 100:
        return "Good"
    elif abs_diff < 200:
        return "Inaccuracy"
    elif abs_diff < 400:
        return "Mistake"
    else:
        return "Blunder"

def analyze_position(fen: str, move_uci: str = None) -> dict:
    """Analyze a chess position using Stockfish"""
    if stockfish_engine is None:
        # Fallback: return basic analysis without engine
        print(f"Stockfish not available, providing basic analysis for FEN: {fen}")
        return {
            "best_move": move_uci or "e2e4",  # Default move if none provided
            "eval": 0,  # Neutral evaluation
            "fen": fen,
            "note": "Stockfish engine not available - using basic analysis"
        }

    try:
        stockfish_engine.set_fen_position(fen)

        # Get best move and evaluation with timeout
        best_move = stockfish_engine.get_best_move()
        evaluation = stockfish_engine.get_evaluation()

        # Convert evaluation to centipawns
        if evaluation["type"] == "cp":
            eval_cp = evaluation["value"]
        elif evaluation["type"] == "mate":
            # Convert mate scores to large centipawn values
            mate_distance = evaluation["value"]
            eval_cp = 10000 if mate_distance > 0 else -10000
        else:
            eval_cp = 0

        return {
            "best_move": best_move,
            "eval": eval_cp,
            "fen": fen
        }
    except Exception as e:
        print(f"Error analyzing position {fen}: {e}")
        # Fallback on error
        return {
            "best_move": move_uci or "e2e4",
            "eval": 0,
            "fen": fen,
            "error": f"Analysis failed: {str(e)}"
        }

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_game(request: AnalysisRequest):
    """Analyze a chess game from PGN"""
    try:
        # Parse PGN
        pgn_string = request.pgn.strip()
        if not pgn_string:
            raise HTTPException(status_code=400, detail="Empty PGN provided")

        print(f"Analyzing PGN: {pgn_string[:100]}...")

        # Create game from PGN
        try:
            game = chess.pgn.read_game(io.StringIO(pgn_string))
            if game is None:
                raise HTTPException(status_code=400, detail="Invalid PGN format")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PGN parsing failed: {str(e)}")

        board = game.board()
        moves_analysis = []

        # Analyze each move
        move_count = 0
        for move in game.mainline_moves():
            move_count += 1
            print(f"Analyzing move {move_count}: {move.uci()}")

            # Get position before move
            fen_before = board.fen()

            # Analyze the position
            analysis = analyze_position(fen_before)

            if "error" in analysis:
                print(f"Analysis error for move {move.uci()}: {analysis['error']}")
                # Continue with default values
                analysis = {
                    "best_move": move.uci(),  # Default to played move
                    "eval": 0,
                    "fen": fen_before
                }

            # Make the move
            board.push(move)

            # Calculate evaluation difference (how much the move changed the position)
            fen_after = board.fen()
            if stockfish_engine:
                try:
                    stockfish_engine.set_fen_position(fen_after)
                    eval_after = stockfish_engine.get_evaluation()

                    if eval_after["type"] == "cp":
                        eval_after_cp = eval_after["value"]
                    elif eval_after["type"] == "mate":
                        eval_after_cp = 10000 if eval_after["value"] > 0 else -10000
                    else:
                        eval_after_cp = 0
                except Exception as e:
                    print(f"Error getting evaluation after move: {e}")
                    eval_after_cp = 0
            else:
                eval_after_cp = 0

            # Evaluation difference (positive means position improved for the player who just moved)
            eval_diff = eval_after_cp - analysis["eval"]

            # For black moves, flip the evaluation perspective
            if board.turn == chess.BLACK:
                eval_diff = -eval_diff

            classification = get_move_classification(eval_diff)

            moves_analysis.append(MoveAnalysis(
                move=move.uci(),
                best_move=analysis["best_move"],
                eval=analysis["eval"],
                classification=classification
            ))

        print(f"Analysis complete. Processed {len(moves_analysis)} moves.")
        return AnalysisResponse(
            moves=moves_analysis,
            final_fen=board.fen()
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in analyze_game: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/explain", response_model=ExplainResponse)
async def explain_move(request: ExplainRequest):
    """Get AI explanation for a chess move"""
    try:
        prompt = f"""
You are a chess coach explaining a move to a beginner. Explain why the best move {request.best_move} is better than the played move {request.move} in this position:

FEN: {request.fen}

Provide a clear, beginner-friendly explanation that covers:
1. What the played move does
2. What the best move does instead
3. Key differences in terms of:
   - Piece activity and development
   - King safety
   - Control of the center
   - Any tactical opportunities or threats

Keep the explanation concise but informative, around 100-150 words.
"""

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert chess coach explaining moves to beginners."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.7
        )

        explanation = response.choices[0].message.content.strip()

        return ExplainResponse(explanation=explanation)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "engine": "stockfish" if stockfish_engine else "demo",
        "stockfish_available": stockfish_engine is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)