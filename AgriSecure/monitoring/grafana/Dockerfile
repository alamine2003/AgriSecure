FROM grafana/grafana:latest

# Installer les plugins Grafana
RUN grafana-cli plugins install grafana-clock-panel grafana-simple-json-datasource

# Copier les fichiers de configuration
COPY provisioning/ /etc/grafana/provisioning/
COPY dashboards/ /var/lib/grafana/dashboards/

# Créer les répertoires nécessaires
RUN mkdir -p /var/lib/grafana/dashboards /var/lib/grafana/provisioning

# Permissions
RUN chown -R grafana:grafana /var/lib/grafana /etc/grafana/provisioning

EXPOSE 3000

# Variables d'environnement par défaut
ENV GF_SECURITY_ADMIN_USER=admin
ENV GF_SECURITY_ADMIN_PASSWORD=admin
ENV GF_USERS_ALLOW_SIGN_UP=false
ENV GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
