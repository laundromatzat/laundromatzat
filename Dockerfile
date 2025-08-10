# Use an official Node.js runtime.
FROM node:20-slim

# Create app directory.
WORKDIR /usr/src/app

# Copy the root package.json and the workspace package.json files.
COPY package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install all dependencies for all workspaces.
RUN npm install

# Copy the rest of the repository.
COPY . .

# Compile the TypeScript API into JavaScript (in backend/dist-api).
RUN npm run build -w backend

# Cloud Run sets $PORT; default to 8080 if undefined.
ENV PORT=8080

# Expose the port the API will listen on.
EXPOSE 8080

# Start the API.
CMD ["node", "backend/dist-api/index.js"]
