from typing import List

def apply_cors(app, allowed_origins: str = None):
    try:
        from fastapi.middleware.cors import CORSMiddleware
    except Exception:
        return

    origins: List[str] = ["http://localhost:5173"]
    if allowed_origins:
        for o in allowed_origins.split(','):
            o = o.strip()
            if o:
                origins.append(o)

    # include wildcard if present
    if '*' in origins:
        origins = ['*']

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
