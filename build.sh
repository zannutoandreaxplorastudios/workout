#!/usr/bin/env bash
set -euo pipefail

pip install -r backend/requirements.txt
npm install --legacy-peer-deps --prefix frontend
npm run build --prefix frontend
