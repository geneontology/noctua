####
#### Example of running locally:
####   make start-noctua
####

# ## Variable to pass the location definition Minerva server server to the deploying
# ## app.
# MINERVA ?= minerva_local

## Variable to define where Noctua looks for Barista.
BARISTA_LOCATION ?= http://localhost:3400

## Variable to define the port that Barista starts on.
BARISTA_PORT ?= 3400

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
	BARISTA_LOCATION=$(BARISTA_LOCATION) node noctua.js

## Start without copying bbop-js over.
.PHONY: start-noctua
start-noctua:
	BARISTA_LOCATION=$(BARISTA_LOCATION) node noctua.js

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
