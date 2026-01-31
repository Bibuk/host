# Development mode
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 3001
EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Start in development mode
CMD ["npm", "run", "dev"]
