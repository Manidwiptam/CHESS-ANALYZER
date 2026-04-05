# Chess Analyzer - Production-Grade Chess Analysis Platform

A complete chess analysis platform similar to Chess.com and Lichess, featuring AI-powered move analysis, position evaluation, and an intuitive board editor.

## Features

### 🎯 Core Functionality
- **Chess Game Analysis**: Upload PGN files and get detailed move-by-move analysis
- **Stockfish Integration**: Real-time position evaluation with 15-ply depth
- **Move Classification**: Automatic blunder, mistake, inaccuracy detection
- **AI Explanations**: OpenAI-powered move explanations for beginners
- **Board Editor**: Lichess-style position setup with drag & drop
- **Evaluation Bar**: Visual centipawn evaluation display

### 🎨 Design
- **Indian Claymorphism**: Soft, tactile UI with earthy color palette
- **Responsive Design**: Works on desktop and mobile
- **Smooth Animations**: Motion-based interactions
- **Accessibility**: Keyboard navigation and screen reader support

## Tech Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **Stockfish**: Chess engine for position analysis
- **python-chess**: Chess game logic and PGN parsing
- **OpenAI API**: AI-powered move explanations

### Frontend
- **React 19**: Modern React with hooks
- **Tailwind CSS v4**: Utility-first styling with custom theme
- **Zustand**: Lightweight state management
- **react-chessboard**: Interactive chess board component
- **chess.js**: Client-side chess logic

## Project Structure

```
chess-analyzer/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Main API application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   │   ├── chess/         # Chess-specific components
│   │   └── common/        # Shared UI components
│   ├── pages/             # Page components
│   ├── store/             # Zustand state management
│   └── styles/            # Global styles
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
└── README.md             # This file
```

## Setup Instructions

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 18+** with npm
- **Stockfish chess engine** (system installation)
- **OpenAI API key** (for explanations)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
# Edit .env file with your OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here

# Make sure Stockfish is installed and accessible
# On Ubuntu/Debian: sudo apt install stockfish
# On macOS: brew install stockfish
# On Windows: Download from https://stockfishchess.org/download/

# Start the backend server
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite dev server)

### 3. API Endpoints

#### POST `/analyze`
Analyzes a chess game from PGN.

**Request:**
```json
{
  "pgn": "[Event \"Casual Game\"]\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6..."
}
```

**Response:**
```json
{
  "moves": [
    {
      "move": "e2e4",
      "best_move": "e2e4",
      "eval": 20,
      "classification": "Best"
    }
  ],
  "final_fen": "r1bqkbnr/1ppp1ppp/p1B5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4"
}
```

#### POST `/explain`
Gets AI explanation for a move.

**Request:**
```json
{
  "move": "e2e4",
  "best_move": "e2e4",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
}
```

**Response:**
```json
{
  "explanation": "The move e2-e4 is the best opening move because..."
}
```

## Usage

### Analyzing a Game
1. Go to the Analysis page
2. Click "Upload PGN"
3. Paste your PGN or game moves
4. Click "Start Analysis"
5. Navigate through moves to see analysis

### Using the Board Editor
1. Go to the Editor page
2. Select pieces from the palette
3. Click on squares to place/remove pieces
4. Use FEN input for precise positions
5. Copy FEN for sharing

### Move Classification
- **Best**: < 20 centipawns from optimal
- **Excellent**: < 50 centipawns from optimal
- **Good**: < 100 centipawns from optimal
- **Inaccuracy**: < 200 centipawns from optimal
- **Mistake**: < 400 centipawns from optimal
- **Blunder**: ≥ 400 centipawns from optimal

## Development

### Running Tests
```bash
# Backend tests
cd backend && python -m pytest

# Frontend tests
npm test
```

### Building for Production
```bash
# Build frontend
npm run build

# Backend is ready for production with uvicorn
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- **Stockfish**: The powerful chess engine
- **python-chess**: Excellent Python chess library
- **react-chessboard**: Great React chess component
- **OpenAI**: For AI-powered explanations
