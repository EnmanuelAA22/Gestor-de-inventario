# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de package.json primero (para mejor cache)
COPY package*.json ./
RUN npm install --production

# Copiar el código de la aplicación
COPY . .

# Crear directorio para logs si no existe
RUN mkdir -p logs

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "backend/server.js"]