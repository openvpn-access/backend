#!/bin/bash

# Configure database

connect_to_database() {
    echo "Configuring the database..."
    while true; do
        mysql --host=db --user=root --password=$1 -t -e "SELECT VERSION();"
        if [[ $? -eq 0 ]]; then
            break
        else
            echo "Database not available, trying again in 1 second..."
            sleep 1
        fi
    done
}

connect_to_database

echo "Connected to database!"

# Start app

cd /opt/app
node ./dist/src/index.js