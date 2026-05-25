# Use Node.js LTS as base image
FROM node:18-alpine

# Set working directory  
WORKDIR /app

# Copy backend package files and install dependencies
COPY Family_Health_Care_WebApp/Backend/server/package*.json ./backend/
RUN cd ./backend && npm ci

# Copy frontend package files and install dependencies
COPY Family_Health_Care_WebApp/Frontend/client/package*.json ./frontend/
RUN cd ./frontend && npm ci

# Copy application code
COPY Family_Health_Care_WebApp/Backend/server ./backend
COPY Family_Health_Care_WebApp/Frontend/client ./frontend

# Build frontend - with error checking
RUN cd ./frontend && \
    echo "Building frontend..." && \
    npm run build 2>&1 && \
    echo "Build completed, checking dist folder..." && \
    if [ ! -d "dist" ]; then \
      echo "ERROR: Frontend dist folder not found after build!"; \
      ls -la; \
      exit 1; \
    fi && \
    echo "SUCCESS: Frontend built successfully" && \
    du -sh dist/ && \
    ls -la dist/ | head -5

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "./backend/index.js"]
