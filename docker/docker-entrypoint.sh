#!/bin/bash

# Configure database

connect_to_database() {
    echo "Configuring the database..."
    while true; do
        mysql -u openvpn-access -p${1} -h db -e "SELECT VERSION();" openvpn_access
        if [[ $? -eq 0 ]]; then
            break
        else
            echo "Database not available, trying again in 1 second..."
            sleep 5
        fi
    done
}

connect_to_database $1

echo "Connected to database!"

echo "Configuring database..."

mysql -u openvpn-access -p${1} -h db openvpn_access < /opt/app/sql/Setup.sql

if [[ $? -eq 0 ]]; then
    echo "Database configured!"
else
    echo "Error configuring the database!"
    exit 1
fi

# Start app

echo "Starting the backend..."

if [[ -d /config ]]; then
    if [[ -f /config/backend.json ]]; then
        cp /config/backend.json /opt/app/dist/config/production.json
    else
        cp /opt/app/config/production.json /config/backend.json
    fi
fi

cd /opt/app
export NODE_ENV=production 
node ./dist/src/index.js