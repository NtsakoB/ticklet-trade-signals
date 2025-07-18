FROM python:3.11-slim

# Set environment
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV TA_LIBRARY_PATH=/usr/local/lib
ENV TA_INCLUDE_PATH=/usr/local/include
ENV LD_LIBRARY_PATH=/usr/local/lib

# Install build tools & dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    wget \
    gcc \
    make \
    autoconf \
    automake \
    libtool \
    libgomp1 \
    python3-dev \
    ca-certificates \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Build TA-Lib C v0.6.0 from GitHub
RUN wget https://github.com/TA-Lib/ta-lib/archive/refs/tags/v0.6.0.tar.gz -O ta-lib-0.6.0.tar.gz && \
    tar -xzf ta-lib-0.6.0.tar.gz && \
    cd ta-lib-0.6.0 && \
    autoreconf -vfi && \
    ./configure --prefix=/usr/local && \
    make && \
    make install && \
    cd .. && rm -rf ta-lib-0.6.0*

# Install Python wrapper
RUN pip install --upgrade pip setuptools wheel
RUN pip install TA-Lib==0.6.3

# Copy app
WORKDIR /app
COPY . .

# Default command
CMD ["python", "ticklet.py"]