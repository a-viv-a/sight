vinxi COMMAND:
    npx vinxi {{COMMAND}}

dev:
    just vinxi dev

build:
    just vinxi build

version:
    just vinxi version

preview: build
    wrangler pages dev

deploy: build
    wrangler pages deploy
        
deploy-main: build
    wrangler pages deploy --branch=main

check:
    tsc --noEmit --watch

# test:
#     npx vitest --exclude ".direnv/**"
