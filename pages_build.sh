#!/bin/bash

mkdir ./bin
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to ./bin --tag 1.36.0
export PATH="$PATH:$(pwd)/.bin"

./bin/just prodconfig build
