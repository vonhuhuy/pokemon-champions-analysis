#!/usr/bin/env python3
"""
PokéChamp — Wrapper for scripts/update_database.py
"""
import os
import sys

SCRIPT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts", "update_database.py")
os.execv(sys.executable, [sys.executable, SCRIPT_PATH] + sys.argv[1:])
