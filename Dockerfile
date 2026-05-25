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
RUN cd ./frontend && npm run build && \
    if [ ! -d "dist" ]; then echo "ERROR: Frontend build failed - dist folder not created"; exit 1; fi && \
    echo "Frontend build successful" && \
    ls -la dist/ | head -10

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "./backend/index.js"]
