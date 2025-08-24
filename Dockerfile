# ---- Build (Node 22) ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# <-- IMPORTANT -->
# We will tell Vite which .env.* to load via --mode.
# Default to production if not provided by docker-compose.
ARG VITE_BUILD_MODE=production
ENV VITE_BUILD_MODE=${VITE_BUILD_MODE}

# This causes Vite to load:
#   .env            (always, if present)
#   .env.${mode}    (here: .env.uat or .env.production)
# And it sets import.meta.env.MODE to that mode.
RUN npm run build -- --mode ${VITE_BUILD_MODE}

# ---- Serve (Nginx 1.28) ----
FROM nginx:1.28-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]