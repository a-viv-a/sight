export PATH := "./node_modules/.bin:" + env_var('PATH')
# https://github.com/solidjs/solid-start/issues/1670
export COMPATIBILITY_DATE := \
    `sed -En 's/compatibility_date[[:space:]]*=[[:space:]]*"([^"]+)"/\1/p' wrangler.toml | head -1`

dev *flags:
    vinxi dev {{flags}}

build:
    vinxi build

prodconfig:
    sed -i 's/true/false/g' src/mode.ts

version:
    vinxi version

preview: build
    wrangler pages dev

deploy: build
    wrangler pages deploy
        
deploy-main: build
    wrangler pages deploy --branch=main

typegen:
    wrangler types --env-interface Wenv

check:
    tsc --noEmit --watch --skipLibCheck

photos *flags:
    UV_THREADPOOL_SIZE=16 npx tsx scripts/process-photos.ts /run/media/aviva/shroom/photography/ {{flags}}

photos-init image_dir slug title *flags:
    npx tsx scripts/process-photos.ts init {{image_dir}} --slug={{slug}} --title="{{title}}" {{flags}}

moderate *args:
    npx tsx scripts/moderate.ts {{args}}

test *flags:
    vitest --exclude ".direnv/**" {{flags}}
