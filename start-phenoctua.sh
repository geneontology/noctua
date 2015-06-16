#bin/bash

# Solr
gnome-terminal --tab -e "bash -c 'cd ~/soft/apache-solr-3.6.2/example; java -jar start.jar';bash"
sleep 7

# Minerva
gnome-terminal --tab -e "bash -c 'cd ~/workspace/monarch-phenote/phenote-minerva/bin; ./start-minerva.sh';bash"
sleep 7

# Barista
gnome-terminal --tab -e "bash -c 'cd ~/workspace/noctua; NODE_BIN=nodejs make start-barista';bash"
sleep 7

# Noctua
gnome-terminal --tab -e "bash -c 'cd ~/workspace/noctua; NODE_BIN=nodejs MINERVA_DEFINITION=minerva_local BARISTA_LOCATION=http://localhost:3400 make start-noctua';bash"

# Gulp
gnome-terminal --tab -e "bash -c 'cd ~/workspace/noctua; ./node_modules/.bin/gulp watch';bash"

echo cd '~/workspace/noctua'
echo 'NODE_BIN=nodejs MINERVA_DEFINITION=minerva_local BARISTA_LOCATION=http://localhost:3400 make start-noctua'

exit 0
