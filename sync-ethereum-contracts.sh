#!/bin/bash -xe

PREVIEW_VERSION=0.1.2-preview-20201014

cd "$(dirname "$0")"

if [ ! -d ethereum-contracts-v0.1 ];then
    git clone \
        --branch v0.1 --single-branch \
        https://github.com/superfluid-finance/ethereum-contracts.git \
        ethereum-contracts-v0.1
else (
    cd ethereum-contracts-v0.1
    git pull
) fi

(
    cd ethereum-contracts-v0.1
    if [ -z "$NO_REBUILD" ];then
        npm ci
        npm run build
    fi
)

cp -R \
    ./ethereum-contracts-v0.1/{README.md,package.json,package-lock.json,truffle-config.js} \
    ./ethereum-contracts-v0.1/{build,contracts,js-sdk,test,scripts} \
    ethereum-contracts/

# sanitizing
(
    cd ethereum-contracts
    rm -f contracts/{superfluid,agreements}/*
    for i in build/contracts/*.json;do
        cp $i $i.bak
        jq 'del(.source,.sourcePath,.sourceMap,.deployedSourceMap,.ast,.legacyAST,.updatedAt)' $i.bak > $i
        rm -f $i.bak
    done 
    jq ".version=\"${PREVIEW_VERSION}\"|del(.publishConfig)" package.json > package.json.new
    mv package.json.new package.json
    jq ".version=\"${PREVIEW_VERSION}\"" package-lock.json > package-lock.json.new
    mv package-lock.json.new package-lock.json
)
