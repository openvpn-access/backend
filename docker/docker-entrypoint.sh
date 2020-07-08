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

# Start app

cd /opt/app
node ./dist/src/index.js