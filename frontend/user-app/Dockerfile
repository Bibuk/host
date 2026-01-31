# Development mode
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 3000
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start in development mode
CMD ["npm", "run", "dev"]
