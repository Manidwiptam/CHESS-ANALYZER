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
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Stockfish
STOCKFISH_PATH = os.getenv("STOCKFISH_PATH", "stockfish")  # Default to system stockfish
stockfish_engine = stockfish.Stockfish(path=STOCKFISH_PATH)
stockfish_engine.set_depth(15)  # Analysis depth
stockfish_engine.set_skill_level(20)  # Max skill

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
    stockfish_engine.set_fen_position(fen)

    # Get best move and evaluation
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

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_game(request: AnalysisRequest):
    """Analyze a chess game from PGN"""
    try:
        # Parse PGN
        pgn_string = request.pgn.strip()
        if not pgn_string:
            raise HTTPException(status_code=400, detail="Empty PGN provided")

        # Create game from PGN
        game = chess.pgn.read_game(io.StringIO(pgn_string))
        if game is None:
            raise HTTPException(status_code=400, detail="Invalid PGN format")

        board = game.board()
        moves_analysis = []

        # Analyze each move
        for move in game.mainline_moves():
            # Get position before move
            fen_before = board.fen()

            # Analyze the position
            analysis = analyze_position(fen_before)

            # Make the move
            board.push(move)

            # Calculate evaluation difference (how much the move changed the position)
            fen_after = board.fen()
            stockfish_engine.set_fen_position(fen_after)
            eval_after = stockfish_engine.get_evaluation()

            if eval_after["type"] == "cp":
                eval_after_cp = eval_after["value"]
            elif eval_after["type"] == "mate":
                eval_after_cp = 10000 if eval_after["value"] > 0 else -10000
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

        return AnalysisResponse(
            moves=moves_analysis,
            final_fen=board.fen()
        )

    except Exception as e:
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
    return {"status": "healthy", "engine": "stockfish"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)