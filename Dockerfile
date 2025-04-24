# Use Node.js LTS version as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy source files
COPY shared ./shared
COPY server ./server

# Install and build shared package
WORKDIR /app/shared
RUN npm install
RUN npm run build

# Install and build server
WORKDIR /app/server
RUN npm install
RUN npm run build

# Set working directory back to root
WORKDIR /app

# Copy source files
COPY shared ./shared
COPY server ./server

# Set working directory to server for running
WORKDIR /app/server

# Expose the port the server runs on
EXPOSE 3000

# Start the server
CMD ["npm", "start"] 