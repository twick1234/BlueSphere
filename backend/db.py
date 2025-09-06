# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

class Base(DeclarativeBase): pass

def db_url():
    host = os.getenv("POSTGRES_HOST","localhost")
    port = os.getenv("POSTGRES_PORT","5432")
    db   = os.getenv("POSTGRES_DB","bluesphere")
    user = os.getenv("POSTGRES_USER","bluesphere")
    pw   = os.getenv("POSTGRES_PASSWORD","bluesphere")
    return f"postgresql+psycopg2://{user}:{pw}@{host}:{port}/{db}"

_engine = None
_Session = None

def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(db_url(), pool_pre_ping=True)
    return _engine

def get_session():
    global _Session
    if _Session is None:
        _Session = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False)
    return _Session()
