FROM oven/bun:1 AS base

# Install dependencies for FFmpeg and Python (for yt-dlp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Download Linux yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp \
    && chmod a+rx yt-dlp

# Generate Prisma client
RUN bunx prisma generate

# Build Next.js app
ENV NODE_ENV=production
RUN bun run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["bun", "run", "start"]
