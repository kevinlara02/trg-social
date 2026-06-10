#!/bin/bash
export PATH="/Users/nicolecaballero/.node/node-v20.18.0-darwin-x64/bin:$PATH"
cd /Users/nicolecaballero/Projects/trg-social
exec node node_modules/.bin/vite --port 5176 --host
