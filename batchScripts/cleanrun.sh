#!/bin/bash


########## cleanrun.sh ########################

echo "STARTING THE SERVER !!!"

# Go to the server directory
cd ~/GitHub/matchbook/server

# clean the log files
node clean

# Run the server
node server

###############################################