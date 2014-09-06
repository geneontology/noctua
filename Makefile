####
#### Example of running locally:
####   make start-barista
####   make start-noctua
####

## Variable to pass the location definition Minerva server server to
## the deploying app.
MINERVA_DEFINITION ?= minerva_local

## Variable to define where Noctua looks for Barista.
BARISTA_LOCATION ?= http://localhost:3400

## Emergency override for exotic Noctua deployments; noctua.js
## internal.
NOCTUA_HOST ?= 127.0.0.1
## Also see: PORT in the noctus.js code; used by Heroku in some cases?

## Variable to define the port that Barista starts on.
BARISTA_PORT ?= 3400

## URL for users.yaml.
GO_USER_METADATA_FILE ?= 'https://s3.amazonaws.com/go-public/metadata/users.json'

BBOP_JS ?= ../bbop-js/
BBOPX_JS ?= ../bbopx-js/

## Testing.
TESTS = \
 $(wildcard js/*.js.tests)
TEST_JS = rhino
TEST_JS_FLAGS = -modules static/bbop.js -modules static/bbopx.js -opt -1

###
### Building.
###

.PHONY: refresh-metadata
refresh-metadata:
	wget $(GO_USER_METADATA_FILE) && mv users.json config/

.PHONY: assemble-app
assemble-app:
	cd $(BBOP_JS) && make bundle
	cd $(BBOPX_JS) && make bundle
	cd
	cp $(BBOP_JS)/staging/bbop.js static/
	cp $(BBOPX_JS)/staging/bbopx.js static/

###
### Tests.
###

## Have to do a little something with basename to make sure we can
## deal with the odd pre-bbop namespacey modules.
.PHONY: test $(TESTS)
test: assemble-app $(TESTS)
$(TESTS):
	echo "trying: $@"
	$(TEST_JS) $(TEST_JS_FLAGS) -f $(@D)/$(basename $(@F)) -f $(@D)/$(@F)

.PHONY: pass
pass:
	make test | grep -i fail; test $$? -ne 0

###
### Commands/environment for application server.
###

##
.PHONY: start-noctua-dev
start-noctua-dev: assemble-app
	MINERVA_DEFINITION=$(MINERVA_DEFINITION) BARISTA_LOCATION=$(BARISTA_LOCATION) node noctua.js

## Start without copying bbop-js over.
.PHONY: start-noctua
start-noctua:
	MINERVA_DEFINITION=$(MINERVA_DEFINITION) BARISTA_LOCATION=$(BARISTA_LOCATION) node noctua.js

###
### Commands/environment for messaging server.
###

.PHONY: start-barista-dev
start-barista-dev: assemble-app
	BARISTA_PORT=$(BARISTA_PORT) node barista.js

.PHONY: start-barista
start-barista:
	BARISTA_PORT=$(BARISTA_PORT) node barista.js

###
### Documentation for JavaScript.
###

.PHONY: docs
docs:
	naturaldocs --rebuild-output --input ./js --project docs/.naturaldocs_project/ --output html docs/
