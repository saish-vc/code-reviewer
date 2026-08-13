FROM python:3.11-slim

# Install system dependencies & C++ compiler for cpplint/static analysis
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cpplint \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and compiled frontend assets
COPY . .

# Expose FastAPI server port
EXPOSE 7860

# Set default environment variables
ENV PORT=7860
ENV PYTHONUNBUFFERED=1

# Run the FastAPI application
CMD ["python", "app.py"]
