FROM python:3.10-slim

# 1. Install System Deps
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# 2. Install ML Libraries
RUN pip3 install --no-cache-dir pandas scikit-learn joblib

# 3. CRITICAL: Install Dependencies required by YOUR wrapper
# Even though the wrapper isn't here yet, the python environment needs these libs to run it later.
RUN pip3 install --no-cache-dir bandit

# 4. Create User (Standardize UID 1000)
RUN useradd -m -u 1000 trainee
WORKDIR /app
RUN mkdir -p /app/data /outputs /app/model_zoo && chown -R trainee:trainee /app /outputs

USER trainee
# No ENTRYPOINT or COPY command needed for the wrapper here!