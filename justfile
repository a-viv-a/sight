export PATH := "./node_modules/.bin:" + env_var('PATH')

dev:
    vinxi dev

build:
    vinxi build

version:
    vinxi version

preview: build
    wrangler pages dev

deploy: build
    wrangler pages deploy
        
deploy-main: build
    wrangler pages deploy --branch=main

check:
    tsc --noEmit --watch

# test:
#     vitest --exclude ".direnv/**"
