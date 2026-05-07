FROM grafana/promtail:latest

# Copier la configuration Promtail
COPY promtail-config.yaml /etc/promtail/config.yml

# Créer les répertoires nécessaires
RUN mkdir -p /tmp

# Permissions
RUN chown -R promtail:promtail /etc/promtail /tmp

# Utiliser l'utilisateur promtail
USER promtail

EXPOSE 9080

CMD ["-config.file=/etc/promtail/config.yml"]
