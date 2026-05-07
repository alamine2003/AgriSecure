FROM nginx:stable-alpine

# Copier les deux configurations
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.dev.conf /etc/nginx/nginx.dev.conf

# Script pour choisir la config selon l'environnement
COPY docker-entrypoint.sh /docker-entrypoint.d/99-choose-config.sh
RUN chmod +x /docker-entrypoint.d/99-choose-config.sh

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
