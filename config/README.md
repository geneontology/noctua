# Configurations
## Example start.yaml files

You can use one of these as the base for your own start.yaml file in
the top directory.

### startup.yaml.all-dev

This file defines a default local development setup where a developer
runs all services locally on localhost, including GOlr, epione,
etc. All-inclusive, all local.

###	startup.yaml.stack-dev

This file defines a default local development setup where a developer
runs all services defined in this repo on localhost. This setup uses a
public GOlr and has no expectation of being able to use epione (in
fact, with a setup like this, one should avoid epione as you may
accidentally clobber production data).

###	startup.yaml.noctua-dev

This file defines a default local development setup where a developer
runs only noctua on localhost--all other services are the public
version. This is useful for very frontend developers to experiment
with the client, workbenches, and do other experiments without
worrying about the rest of the stack.

If weird errors during occur, please see:
https://github.com/geneontology/noctua/issues/201 or search recent
tracker issues.

Naturally, one should be **very** careful as it is possible to destroy
public data with this setup.

### startup.yaml.production

This is the file that is used by the current "production" instance of
the services. It can be used as a guide for setting up your own
instance.

### startup.yaml.production-dev

This is the file that is used by the current development "production"
instance of the services. It can be used as a guide for setting up
your own instance for experimentation.

## Others
### users.json
   A downstream version of geneontology/go-site's metadata/users.yaml
   (literally
   https://s3.amazonaws.com/go-public/metadata/users.json). Required
   for Barista authorization checks.
