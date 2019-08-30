#!/usr/bin/env bash

for buildscript in */build.sh; do
  lang=$(dirname $buildscript)
  echo $lang
  cd `dirname $buildscript`
  ./build.sh
  cd ..
done