#!/bin/bash
BASEURL=https://vno0ju7fl5.execute-api.eu-west-1.amazonaws.com/prod/
#python csharp go java nodejs
for run in $(seq 1 2 3); do
  http post $BASEURL/restart current_run=$run
  for lang in python csharp go java nodejs; do
    echo $lang
    BASEURL=$BASEURL LANG=$lang caffeinate -u npx artillery run -o output/result-192-$run-$lang.json loadtest.yml
  done
done
