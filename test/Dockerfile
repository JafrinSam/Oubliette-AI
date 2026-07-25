# 1. Lightweight Python Base
FROM python:3.10-slim

# Prevent interactive prompts during package installs
ENV DEBIAN_FRONTEND=noninteractive
# Ensure Python outputs everything to the terminal (good for container logs)
ENV PYTHONUNBUFFERED=1

# 2. System Deps
# Note: libgomp1 is CRITICAL for LightGBM to perform multi-threaded training
RUN apt-get update && apt-get install -y \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# 3. Install Libraries
# Added Polars for big data handling and LightGBM for the model
# 3. Install Libraries
# Added pyarrow to resolve the "No module named 'pyarrow'" error
RUN pip3 install --no-cache-dir \
    pandas \
    numpy \
    scikit-learn \
    polars \
    lightgbm \
    pyarrow \
    joblib \
    matplotlib \
    bandit

# 4. Security User (Mandatory for Oubliette AI)
# Running as a non-root user prevents potential container breakout attacks
RUN useradd -m -u 1000 trainee

# Create the expected directory structure for Oubliette
RUN mkdir -p /home/trainee/app /home/trainee/data /home/trainee/models \
    && chown -R trainee:trainee /home/trainee

WORKDIR /home/trainee/app

# 5. Set User
USER trainee

# Default command (can be overridden by Oubliette task runner)
CMD ["python3", "train_script.py"]