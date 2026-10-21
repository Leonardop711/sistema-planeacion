FROM node:20-alpine

# Instalar herramientas de compilación para módulos nativos (ej. bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

# Copiar manifiestos de paquetes
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto predeterminado (Railway lo sobreescribirá dinámicamente con la variable $PORT)
EXPOSE 3000

# Comando de arranque del servidor
CMD ["npm", "start"]
