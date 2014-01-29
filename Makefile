####
#### Example of running locally:
####  M3LOC=http://localhost:6800 make start-app
####

M3LOC ?= http://localhost:6800

.PHONY: assemble-app
assemble-app:
	cp ../bbop-js/staging/bbop.js static/

##
.PHONY: start-app
start-app: assemble-app
	M3LOC=$(M3LOC) node server.js

## Start without copying bbop-js over.
.PHONY: start-app-non-bbop
start-app-non-bbop:
	M3LOC=$(M3LOC) node server.js
