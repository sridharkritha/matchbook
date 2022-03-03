#!/bin/bash


########## ./gitaddupdate.sh ########################
echo "GIT UPDATE !!!"

# Go to the matchbook directory
cd ~/GitHub/matchbook

# move all your files changes(unstage) to stage
git add .

# commit all the staged files
git commit -m "Adding the last bet data"  

# update the local copy using remote copy (local <= remote)
git pull origin main

# update the remote copy using the local copy (local => remote)
git push origin main

###################################################