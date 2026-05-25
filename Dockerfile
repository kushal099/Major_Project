# Use Node.js LTS as base image
FROM node:18-alpine

# Set working directory  
WORKDIR /app

# Copy backend package files and install dependencies
COPY Family_Health_Care_WebApp/Backend/server/package*.json ./Family_Health_Care_WebApp/Backend/server/
RUN cd Family_Health_Care_WebApp/Backend/server && npm ci

# Copy frontend package files and install dependencies
COPY Family_Health_Care_WebApp/Frontend/client/package*.json ./Family_Health_Care_WebApp/Frontend/client/
RUN cd Family_Health_Care_WebApp/Frontend/client && npm ci

# Copy application code
COPY Family_Health_Care_WebApp/Backend/server ./Family_Health_Care_WebApp/Backend/server
COPY Family_Health_Care_WebApp/Frontend/client ./Family_Health_Care_WebApp/Frontend/client

# Build frontend
RUN cd Family_Health_Care_WebApp/Frontend/client && npm run build

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "Family_Health_Care_WebApp/Backend/server/index.js"]
