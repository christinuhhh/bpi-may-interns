FROM python:3.11.8

WORKDIR /

# Install system dependencies including FFmpeg
RUN apt-get update && apt-get install -y \
  ffmpeg \
  libsm6 \
  libxext6 \
  libxrender-dev \
  libgomp1 \
  wget \
  git \
  && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt to the container
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Add a non-root user to run the application
RUN useradd -m -u 1000 user

# Set the user and home directory environment variables
USER user
ENV HOME=/home/user \
  PATH=/home/user/.local/bin:$PATH

# Create the application directory
WORKDIR $HOME/app

# Copy the application code and model files
COPY --chown=user . $HOME/app/

# Expose the port the FastAPI app runs on
EXPOSE 7860

# Command to run the FastAPI app
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]