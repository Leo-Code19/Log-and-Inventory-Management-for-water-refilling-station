"""
Custom middleware for handling CORS and other HTTP headers
"""

class MediaCorsMiddleware:
    """
    Middleware to add CORS headers specifically for media files
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Check if the request is for a media file
        if request.path.startswith('/media/'):
            # Add CORS headers for media files
            response["Access-Control-Allow-Origin"] = "*"
            response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Origin, Content-Type, Accept"
            response["Cross-Origin-Resource-Policy"] = "cross-origin"
            response["Cross-Origin-Embedder-Policy"] = "require-corp"
            
        return response
