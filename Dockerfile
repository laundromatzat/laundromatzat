# Use an official Node.js runtime.
FROM node:20-slim

# Create app directory.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first.
COPY package*.json ./

# Install all dependencies (dev deps are needed for TypeScript compilation).
RUN npm install

# Copy the rest of the repository.
COPY . .

# Compile the TypeScript API into JavaScript (dist-api folder).
RUN npm run build:api

# Cloud Run sets $PORT; default to 8080 if undefined.
ENV PORT=8080

# Expose the port the API will listen on.
EXPOSE 8080

# Start the API.
CMD ["node", "dist-api/index.js"]
