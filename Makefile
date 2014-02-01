####
#### Example of running locally:
####  M3LOC=http://localhost:6800 make start-app
####

M3LOC ?= http://localhost:6800
MSGLOC ?= http://localhost:3400

.PHONY: assemble-app
assemble-app:
	cp ../bbop-js/staging/bbop.js static/

##
.PHONY: start-app-dev
start-app-dev: assemble-app
	M3LOC=$(M3LOC) node server.js

## Start without copying bbop-js over.
.PHONY: start-app
start-app:
	M3LOC=$(M3LOC) node server.js

###
### TODO/BUG: Fix commands/environment for messaging server.
###

.PHONY: start-messenger
start-messenger:
	MSGLOC=$(MSGLOC) node messenger.js
