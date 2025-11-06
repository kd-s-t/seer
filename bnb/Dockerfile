FROM node:22-alpine

WORKDIR /app

# Update npm to latest version
RUN npm install -g npm@11.6.2

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy contract files
COPY . .

# Default command (can be overridden)
CMD ["npm", "test"]

