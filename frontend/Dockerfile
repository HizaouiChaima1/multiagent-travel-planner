FROM node:20-alpine

WORKDIR /app

# Les dépendances d'abord : cette couche est mise en cache tant que
# package.json et package-lock.json ne changent pas.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host 0.0.0.0 : indispensable pour que Vite soit joignable depuis l'hôte.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
