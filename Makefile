####
#### Example of running locally:
####  M3LOC=http://localhost:6800 make start-noctua
####

## Variable to pass the location of the MMM server to the deploying
## app.
M3LOC ?= http://localhost:6800

## Variable to pass the location of the (optional) messaging server to
## the deploying app.
MSGLOC ?= http://localhost:3400

## Variable to pass the desired port to use to the messaging server at
## startup.
MSGPORT ?= 3400

## Testing.
TESTS = \
 $(wildcard js/*.js.tests)
TEST_JS = rhino
TEST_JS_FLAGS = -modules static/bbop.js -opt -1

###
### Building.
###

.PHONY: assemble-app
assemble-app:
	cp ../bbop-js/staging/bbop.js static/

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
	MSGLOC=$(MSGLOC) node noctua.js

## Start without copying bbop-js over.
.PHONY: start-noctua
start-noctua:
	MSGLOC=$(MSGLOC) node noctua.js

###
### Commands/environment for messaging server.
###

.PHONY: start-barista-dev
start-barista-dev: assemble-app
	MSGPORT=$(MSGPORT) MSGLOC=$(MSGLOC) node barista.js

.PHONY: start-barista
start-barista:
	MSGPORT=$(MSGPORT) MSGLOC=$(MSGLOC) node barista.js

###
### Documentation for JavaScript.
###

.PHONY: docs
docs:
	naturaldocs --rebuild-output --input ./js --project docs/.naturaldocs_project/ --output html docs/
