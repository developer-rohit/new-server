#!/bin/bash
until reportDistributor.py; do
    echo " Script crashed with exit code $?. Restarting..." >&2
    sleep 1
done
