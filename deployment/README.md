# Deployment

## Manual

This is the way that a lot of development is done. The Noctua stack is
designed to be embarrassingly flexible, at the cost of knowing what
the moving parts are. For an overview of how to setup, see the main
[README.md](http://github.com/geneontology/noctua/) in the project
repo.

## Ansible

This is aimed at getting AWS instances of a complete Noctua stack up
and running with as little pain as possible, all concentrated on a
single instance.

We are going to assume that you have a fairly standard AWS instance,
with decent memory, keyed to "noctua-demo-deployment.pem", at
address 127.0.0.1.
 
```
ansible-playbook -l 127.0.0.1 --private-key noctua-demo-deployment.pem ./aws-noctua-up.playbook.yaml
```

## Ansible/Docker

See: http://github.com/geneontology/ansible-machine-bootstrap
