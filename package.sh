#!/usr/bin/env bash

#version=`grep '"version":' manifest.json | cut -d ':' -f 2 | grep -o '\\d\+\.'`
version=`grep '"version":' manifest.json | cut -d ':' -f 2 | grep -o '[0-9]\+\.[0-9]\+'`
if [ ! -z ${version} ]; then
    echo "zipping package version: ${version}"
    zip -r fantasy-hockey-assistant-${version}.zip . -x '*.git*' '*.md' 'LICENSE' 
else
    echo "Version not found"
fi
