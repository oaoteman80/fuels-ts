#!/bin/bash

set -euo pipefail

FUELS_DEBUG=${FUELS_DEBUG:-}
SCRIPT_DIR="$PWD/src/call-test-script"
BIN_DIR="$SCRIPT_DIR/out/debug"

(cd ../../scripts; chmod +x ./forc-build-with-cache.sh; ./forc-build-with-cache.sh $SCRIPT_DIR)

# if [[ -n "$FUELS_DEBUG" ]]; then
#   pnpm forc parse-bytecode "$BIN_DIR/call-test-script.bin" > "$BIN_DIR/call-test-script.txt"
# fi
