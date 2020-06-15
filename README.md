# The Noctua Stack

The Noctua Stack is a curation platform developped by the [Gene Ontology Consortium](http://geneontology.org). The stack is composed of:
* [Minerva](https://github.com/geneontology/minerva): the backend data server to retrieve, store, update and delete annotations.
* [Barista](https://github.com/geneontology/noctua.git): an authentication layer controling and formating all communications from/to Minerva.
* [Noctua](https://github.com/geneontology/noctua.git): the [website](http://noctua.geneontology.org) to browse the annotations in production and development and provide an editorial platform to produce Gene Ontology Causal Activity Models (or [GO-CAMs](http://geneontology.org/go-cam/docs)) using either the simple UI [Noctua Form](https://github.com/geneontology/simple-annoton-editor) or the more advanced [Graph Editor](https://github.com/geneontology/noctua/blob/master/js/NoctuaEditor.js).

The biological knowledge are stored in [RDF](https://www.w3.org/RDF/)/[OWL](https://www.w3.org/OWL/) using the [blazegraph](https://www.blazegraph.com) triplestore implementation.
In effect, any piece of knowledge stored in RDF/OWL is a triple { subject, predicate, object } defining a relationship (or association) between a subject and an object. Those triples are also commonly stored in [Turtle](https://www.w3.org/TeamSubmission/turtle/) files.

## Installation

### Pre-requisite
You must have npm installed. On ubuntu/debian, simply type:
```
sudo apt-get install nodejs
```

On OSX, it is also possible to install npm either from [nodejs.org](https://nodejs.org) or using [brew](https://brew.sh):
```
brew install node
```

### Steps for a local Installation
```
# Noctua Stack is a multi-repositories project, optionally create a main directory for the stack
# These instruction assume that "gulp" is in your path; if local-only: ./node_modules/.bin/gulp
mkdir noctua-stack && cd noctua-stack

git clone https://github.com/geneontology/go-site.git
git clone https://github.com/geneontology/noctua-models.git
git clone https://github.com/geneontology/minerva.git

# Build Minerva CLI
minerva/build-cli.sh

# Get file(s) for Minerva (check default locations in startup.yaml)
wget -L -o /tmp/blazegraph-go-lego-reacto-neo.jnl.gz http://skyhook.berkeleybop.org/blazegraph-go-lego-reacto-neo.jnl.gz

# Create default authentication users
mkdir barista
vim barista/local.yaml
-
 uri: 'http://orcid.org/XXXX-XXXX-XXXX-XXXX'
 username: my_username
 password: my_password

# Install Noctua Form (old "simple-annoton-editor")
git clone https://github.com/geneontology/simple-annoton-editor.git
cd simple-annoton-editor
npm install
npm run build
cd ../

# Install Noctua as an all-local installation.
git clone https://github.com/geneontology/noctua.git
cd noctua
npm install
cp config/startup.yaml.stack-dev ./startup.yaml

# Edit configuration file (barista, user, group, noctua models location, minerva memory to at least 16GB, link to NoctuaForm / SAE)
vim startup.yaml

# Build the stack and Blazegraph Journal (triplestore)
gulp build
# Optional if running first time.
gulp batch-minerva-destroy-journal
gulp batch-minerva-create-journal

# Then launch the stack:
gulp run-barista &> barista.log &
gulp run-minerva &> minerva.log &
gulp run-noctua &> noctua.log &
```

## Additional notes

### Gulp Tasks
- doc - build the docs, available in doc/
- test - need more here
- build - assemble the apps for running
- watch - development file monitor
- clean - clean out /doc and /deploy

In addition, the last 3 lines of the installation steps launch all the 3 layers of the Noctua Stack:
```
gulp run-barista &> barista.log &
gulp run-minerva &> minerva.log &
gulp run-noctua &> noctua.log &
```

And Gulp can be used to both destroy and create [blazegraph](https://www.blazegraph.com) journals (triplestore):
```
gulp batch-minerva-destroy-journal
gulp batch-minerva-create-journal
```

### Users & groups
Barista, the authentication layer needs two files to run: [users.yaml](https://github.com/geneontology/go-site/blob/master/metadata/users.yaml) and [groups.yaml](https://github.com/geneontology/go-site/blob/master/metadata/groups.yaml).
These files defined who is authorized to log in to the Noctua Stack to perform biological curations.
* To know more about curation with the Noctua Stack, [visit our wiki](http://wiki.geneontology.org/index.php/Noctua).
* To request an account to curate with the Noctua Stack, [contact us](http://help.geneontology.org)

### Libraries and CLI to communicate with the Noctua Stack

#### bbop-manager-minerva
This is the high-level API with OWL formatted requests (e.g. add individual, add fact or evidence using class expressions).
[https://github.com/berkeleybop/bbop-manager-minerva](https://github.com/berkeleybop/bbop-manager-minerva)

#### minerva-requests
This is the request object used to format specific queries to Minerva. It is composed of a basic `request` object as well as a `request_set` designed to chain multiple `request` objects and speed up complex tasks.
[https://github.com/berkeleybop/minerva-requests](https://github.com/berkeleybop/minerva-requests)

Some useful details about the API are described [here](https://github.com/berkeleybop/bbop-manager-minerva/wiki/MinervaRequestAPI)

#### CLI (REPL)
The Noctua REPL is a recommended step for anyone trying to learn the syntax and how to build requests to Minerva in the Noctua Stack.
As any REPL, it allows for the rapid testing of multiple commands and to check the [responses from barista](https://github.com/berkeleybop/bbop-response-barista).
This project can be considered as a basic prototype for any other client wanting to interact with the stack.

[https://github.com/geneontology/noctua-repl](https://github.com/geneontology/noctua-repl)

### Known issues
The bulk of major issues and feature requests are handled by the
tracker (https://github.com/geneontology/noctua/issues). If something is
not mentioned here or in the tracker, please contact [Seth Carbon](https://github.com/kltm) or [Chris Mungall](https://github.com/cmungall).

- Sometimes, when moving instance or relations near a boundary, the
  relations will fall out of sync; either move nearby instances or
  refresh the model
- Sometimes, when editing an instance, the relations (edges) will
  fall out of sync; either move nearby instances or refresh the
  model
- The endpoint scheme is reversed between creation and instantiation
- TODO, etc.
