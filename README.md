# 🤖 AI Code Reviewer

A FastAPI-powered AI code review tool that uses NVIDIA's LLM API to provide intelligent code analysis, bug detection, and suggestions across multiple programming languages.

## ✨ Features

- **Multi-language support** — Python, C, C++, JavaScript, Java, and more
- **Static analysis** — Integrates with `pylint`, `bandit`, and `cpplint`
- **AI-powered reviews** — Uses NVIDIA NIM (LLM) for deep code insights and suggestions
- **Rate limiting** — Built-in rate limiting per client
- **Review history** — Logs all reviews to CSV for later analysis
- **Teaching Assistant Queue** — Submission queue for TA review workflows
- **REST API** — Clean FastAPI endpoints for easy integration

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- An [NVIDIA API key](https://build.nvidia.com/) (for LLM-powered reviews)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/code-reviewer.git
   cd code-reviewer
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your NVIDIA API key
   ```

4. **Run the server**
   ```bash
   python app.py
   ```
   The server will start at `http://localhost:8000`.

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/review` | Submit code for AI review |
| `GET`  | `/history` | Get review history |
| `GET`  | `/ta-queue` | View TA submission queue |
| `POST` | `/ta-submit` | Submit to TA queue |
| `GET`  | `/docs` | Interactive API docs (Swagger UI) |

## 📦 Tech Stack

- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/)
- **AI**: [NVIDIA NIM](https://build.nvidia.com/) via OpenAI-compatible API
- **Static Analysis**: `pylint`, `bandit`, `cpplint`
- **Storage**: CSV-based review log

## 🛡️ Security Note

Never commit your `.env` file. Use `.env.example` as a template and keep your API keys private.

## 📄 License

MIT License — feel free to use and modify.
