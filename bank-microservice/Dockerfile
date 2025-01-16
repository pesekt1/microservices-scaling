# Use the official Node.js image as the base image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Add wait-for-it.sh script
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Expose the port the app runs on
EXPOSE 3000

# Start the application
#CMD ["npm", "start"]
# Run the application with the wait-for-it.sh script, set the timeout to 60 seconds
CMD ["./wait-for-it.sh", "rabbitmq:5672", "-t", "60", "--", "npm", "start"]