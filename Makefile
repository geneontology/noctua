####
####
####

.PHONY: assemble-app
assemble-app:
	cp ./js/bbop-mme-edit.js static/

##
.PHONY: start-app
start-app: assemble-app
	node server.js
