FROM node:22.14.0

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm install -g @expo/ngrok

COPY . .

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

EXPOSE 19000
EXPOSE 19001
EXPOSE 19002
EXPOSE 8081

CMD ["npm", "start"]