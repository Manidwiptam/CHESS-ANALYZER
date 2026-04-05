#!/usr/bin/env python3
"""
Test the backend logic without starting the server
"""
import chess
import chess.pgn
import io

# Test PGN parsing
pgn = '''[Event "Test Game"]
[Site "Local Test"]
[Date "2024.01.01"]
[Round "1"]
[White "Test"]
[Black "Test"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 *'''

print("Testing PGN parsing...")
try:
    game = chess.pgn.read_game(io.StringIO(pgn))
    if game is None:
        print("❌ PGN parsing failed")
    else:
        print("✅ PGN parsing successful")
        board = game.board()
        moves = list(game.mainline_moves())
        print(f"Found {len(moves)} moves")
        for i, move in enumerate(moves):
            print(f"Move {i+1}: {move.uci()}")
except Exception as e:
    print(f"❌ PGN parsing error: {e}")

# Test chess engine (if available)
print("\nTesting chess engine...")
try:
    import chess.engine
    engine = chess.engine.SimpleEngine.popen_uci("/usr/bin/stockfish")
    print("✅ Chess engine initialized")

    # Test analysis
    board = chess.Board()
    result = engine.play(board, chess.engine.Limit(time=0.1))
    print(f"Best move: {result.move.uci() if result.move else 'None'}")

    info = engine.analyse(board, chess.engine.Limit(time=0.1))
    score = info.get("score", chess.engine.Cp(0))
    if isinstance(score, chess.engine.Cp):
        print(f"Evaluation: {score.score()} centipawns")
    else:
        print(f"Evaluation: {score}")

    engine.quit()
except Exception as e:
    print(f"❌ Chess engine error: {e}")

print("\nTest complete!")