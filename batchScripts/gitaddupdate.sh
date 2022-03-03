#!/bin/bash


########## ./gitaddupdate.sh ########################
echo "GIT UPDATE !!!"

# Go to the matchbook directory
cd ~/GitHub/matchbook

# move all your files changes(unstage) to stage
git add .

# commit all the staged files
git commit -m "Adding the last bet data"  

# update the local copy <=== remote copy
git pull origin main

###################################################