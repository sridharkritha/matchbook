#!/bin/bash


########## ./gitignoreupdate.sh ########################
echo "GIT UPDATE !!!"

# Go to the matchbook directory
cd ~/GitHub/matchbook

# delete all the staged/unstaged changes
git reset --hard

# update the local copy <=== remote copy
git pull origin main

###################################################