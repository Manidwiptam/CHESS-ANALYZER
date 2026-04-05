from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import chess
import chess.pgn
import chess.engine
import openai
import os
import io
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Chess Analysis API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Stockfish engine
engine = None
try:
    engine = chess.engine.SimpleEngine.popen_uci("/usr/bin/stockfish")
    print("Stockfish engine initialized successfully")
except Exception as e:
    print(f"Failed to initialize Stockfish: {e}")
    print("Application will run in demo mode")

# Initialize OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Pydantic models
class PGNRequest(BaseModel):
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

def analyze_position(board: chess.Board) -> dict:
    """Analyze a chess position using Stockfish"""
    if engine is None:
        return {"error": "Stockfish not found"}

    try:
        # Get best move and evaluation
        result = engine.play(board, chess.engine.Limit(time=0.1))
        best_move = result.move.uci() if result.move else "e2e4"

        # Get evaluation
        info = engine.analyse(board, chess.engine.Limit(time=0.1))
        score = info.get("score", chess.engine.Cp(0))

        if isinstance(score, chess.engine.Cp):
            eval_cp = score.score()
        elif isinstance(score, chess.engine.Mate):
            eval_cp = 10000 if score.mate() > 0 else -10000
        else:
            eval_cp = 0

        return {
            "best_move": best_move,
            "eval": eval_cp,
            "fen": board.fen()
        }
    except Exception as e:
        print(f"Error analyzing position: {e}")
        return {"error": f"Analysis failed: {str(e)}"}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_game(request: PGNRequest):
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

            # Analyze the position before the move
            analysis = analyze_position(board)

            if "error" in analysis:
                print(f"Analysis error for move {move.uci()}: {analysis['error']}")
                # Continue with default values
                analysis = {
                    "best_move": move.uci(),  # Default to played move
                    "eval": 0,
                    "fen": board.fen()
                }

            # Make the move
            board.push(move)

            # Calculate evaluation difference (how much the move changed the position)
            if engine:
                try:
                    info_after = engine.analyse(board, chess.engine.Limit(time=0.1))
                    score_after = info_after.get("score", chess.engine.Cp(0))

                    if isinstance(score_after, chess.engine.Cp):
                        eval_after_cp = score_after.score()
                    elif isinstance(score_after, chess.engine.Mate):
                        eval_after_cp = 10000 if score_after.mate() > 0 else -10000
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

        response = openai.chat.completions.create(
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
    return {"status": "healthy", "engine": "stockfish" if engine else "demo"}

@app.on_event("shutdown")
def shutdown_event():
    """Clean up engine on shutdown"""
    if engine:
        engine.quit()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)