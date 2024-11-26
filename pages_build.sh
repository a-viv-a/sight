#!/bin/bash

mkdir ./bin
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to ./bin
export PATH="$PATH:$(pwd)/.bin"

just build
