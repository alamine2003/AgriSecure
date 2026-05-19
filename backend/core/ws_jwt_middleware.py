from urllib.parse import parse_qs

from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication


@database_sync_to_async
def _get_user(token: str):
    jwt_auth = JWTAuthentication()
    validated = jwt_auth.get_validated_token(token)
    return jwt_auth.get_user(validated)


class JwtAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        token = None

        # Priorité 1 : subprotocol WebSocket — le token n'apparaît jamais dans l'URL
        subprotocols = scope.get("subprotocols", [])
        if subprotocols:
            token = subprotocols[0]

        # Priorité 2 : query string (rétro-compatibilité)
        if not token:
            query_string = scope.get("query_string", b"").decode("utf-8")
            params = parse_qs(query_string)
            if "token" in params and params["token"]:
                token = params["token"][0]

        if token:
            try:
                scope["user"] = await _get_user(token)
            except Exception:
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)
