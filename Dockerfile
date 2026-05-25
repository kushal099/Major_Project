# Use Node.js LTS as base image
FROM node:18-alpine

# Set working directory  
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build frontend if needed
WORKDIR /app/Frontend/client
RUN npm install
RUN npm run build

# Go back to root
WORKDIR /app

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "Backend/server/index.js"]
