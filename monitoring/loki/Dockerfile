FROM grafana/loki:latest

# Copier la configuration Loki
COPY loki-config.yaml /etc/loki/local-config.yaml

# Créer les répertoires nécessaires
RUN mkdir -p /loki

# Permissions
RUN chown -R loki:loki /loki /etc/loki

# Utiliser l'utilisateur loki
USER loki

EXPOSE 3100

CMD ["-config.file=/etc/loki/local-config.yaml"]
