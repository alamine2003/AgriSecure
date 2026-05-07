#!/bin/sh
set -e

echo "=== Nginx Configuration Selector ==="
echo "NGINX_MODE: ${NGINX_MODE:-not set}"

# Sélectionner la configuration nginx selon NGINX_MODE
if [ "$NGINX_MODE" = "dev" ]; then
    echo "✓ Using DEVELOPMENT configuration"
    echo "  - Frontend: http://frontend:3000 (Vite dev server)"
    echo "  - HMR: Enabled"
    echo "  - Hot Reload: Yes"

    if [ -f /etc/nginx/nginx.dev.conf ]; then
        cp /etc/nginx/nginx.dev.conf /etc/nginx/nginx.conf
        echo "✓ Copied nginx.dev.conf -> nginx.conf"
    else
        echo "✗ ERROR: nginx.dev.conf not found!"
        exit 1
    fi

elif [ "$NGINX_MODE" = "prod" ]; then
    echo "✓ Using PRODUCTION configuration"
    echo "  - Frontend: Static files (/usr/share/nginx/html)"
    echo "  - Gzip: Enabled"
    echo "  - Caching: Optimized"

    if [ -f /etc/nginx/nginx.prod.conf ]; then
        cp /etc/nginx/nginx.prod.conf /etc/nginx/nginx.conf
        echo "✓ Copied nginx.prod.conf -> nginx.conf"
    else
        echo "⚠ WARNING: nginx.prod.conf not found, using default nginx.conf"
    fi

else
    echo "⚠ NGINX_MODE not set, using default configuration (dev mode)"
    if [ -f /etc/nginx/nginx.dev.conf ]; then
        cp /etc/nginx/nginx.dev.conf /etc/nginx/nginx.conf
        echo "✓ Defaulting to nginx.dev.conf"
    fi
fi

# Afficher la config choisie
echo ""
echo "=== Active Nginx Configuration ==="
grep -A 2 "upstream react\|upstream frontend_static" /etc/nginx/nginx.conf || echo "No react/frontend upstream found"

exit 0
