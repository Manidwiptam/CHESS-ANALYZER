# Chess Analysis Platform - Deployment Guide

## Overview
This chess analysis platform consists of a React frontend and FastAPI backend with Stockfish integration.

## Architecture
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Python + Stockfish engine
- **State Management**: Zustand
- **Chess Logic**: chess.js + python-chess
- **AI Explanations**: OpenAI GPT

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- Stockfish chess engine (optional - runs in demo mode without it)

### Setup
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Start backend
python start.py

# Start frontend (in another terminal)
npm run dev
```

## Production Deployment

### Backend Deployment (Railway/Render)

1. **Create a new project** on Railway or Render
2. **Connect your repository** or deploy manually
3. **Set environment variables**:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=8000
   STOCKFISH_PATH=  # Leave empty for auto-detection
   ```
4. **Install Stockfish** on the server (if possible):
   - Railway: May need to use a Docker-based deployment
   - Render: Use build command to install Stockfish

5. **Deployment files created**:
   - `Procfile`: `web: python start.py`
   - `runtime.txt`: `python-3.11`
   - `requirements.txt`: All Python dependencies

### Frontend Deployment (Vercel)

1. **Connect repository** to Vercel
2. **Set environment variables**:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```
3. **Deploy**: Vercel will automatically build and deploy

### Alternative: Docker Deployment

If Stockfish installation is problematic, consider Docker:

```dockerfile
# Dockerfile for backend
FROM python:3.11-slim

# Install Stockfish
RUN apt-get update && apt-get install -y stockfish

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "start.py"]
```

## Environment Variables

### Backend (.env)
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=8000
STOCKFISH_PATH=  # Optional override
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.com
```

## API Endpoints

- `GET /health` - Health check
- `POST /analyze` - Analyze chess game from PGN
- `POST /explain` - Get AI explanation for a move

## Features

- **Game Analysis**: Move-by-move evaluation with Stockfish
- **Move Classification**: Best, Excellent, Good, Inaccuracy, Mistake, Blunder
- **AI Explanations**: GPT-powered move explanations
- **Lichess-style Board**: Interactive chess board with move highlighting
- **Responsive Design**: Works on desktop and mobile

## Troubleshooting

### Backend Issues
- **Stockfish not found**: Application runs in demo mode
- **OpenAI errors**: Check API key configuration
- **CORS errors**: Backend allows all origins by default

### Frontend Issues
- **API connection failed**: Check VITE_API_URL environment variable
- **Build errors**: Ensure all dependencies are installed

## Performance Notes

- Stockfish analysis depth reduced to 10 for production performance
- Backend includes comprehensive error handling
- Frontend includes loading states and error boundaries

## Security Considerations

- OpenAI API key stored securely in environment variables
- CORS configured for production domains
- Input validation on all API endpoints