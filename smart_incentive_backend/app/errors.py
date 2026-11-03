from flask import jsonify
from werkzeug.exceptions import HTTPException

def register_error_handlers(app):
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """Return JSON instead of HTML for HTTP errors."""
        response = e.get_response()
        response.data = jsonify({
            "code": e.code,
            "name": e.name,
            "description": e.description,
        }).data
        response.content_type = "application/json"
        return response

    @app.errorhandler(Exception)
    def handle_exception(e):
        """Return JSON instead of HTML for unhandled exceptions."""
        # Pass through HTTP errors
        if isinstance(e, HTTPException):
            return e

        # Now you're handling non-HTTP exceptions only
        return jsonify({
            "code": 500,
            "name": "Internal Server Error",
            "description": "An unexpected error occurred on the server.",
            "error_details": str(e) # In production, you might want to log this instead of sending it to the client
        }), 500
