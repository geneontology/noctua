####
####
####

.PHONY: assemble-app
assemble-app:
	cp ./js/bbop-mme-context.js static/
	cp ./js/bbop-mme-edit.js static/
	cp ../bbop-js/staging/bbop.js static/

##
.PHONY: start-app
start-app: assemble-app
	node server.js
