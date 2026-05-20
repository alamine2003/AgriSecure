FROM prom/prometheus:latest

# Copier la configuration Prometheus
COPY prometheus.yml /etc/prometheus/prometheus.yml

# Créer les répertoires nécessaires
RUN mkdir -p /prometheus

# Permissions
RUN chown -R nobody:nogroup /prometheus /etc/prometheus

# Utiliser l'utilisateur non-root
USER nobody

EXPOSE 9090

CMD ["--config.file=/etc/prometheus/prometheus.yml", \
     "--storage.tsdb.path=/prometheus", \
     "--web.console.libraries=/etc/prometheus/console_libraries", \
     "--web.console.templates=/etc/prometheus/consoles", \
     "--storage.tsdb.retention.time=200h", \
     "--web.enable-lifecycle"]
