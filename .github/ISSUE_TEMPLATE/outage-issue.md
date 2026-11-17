---
name: Maintenance outage issue
about: Create a new outage issue
title: 'Maintenance outage: 20YY-MM-DD'
labels: ''
assignees: vanaukenk, kltm, pgaudet

---

- [ ] Send reminder email to go-consortium mailing list
- [ ] Run noctua-models-migration pipeline for (@vanaukenk) (automated to day before) to get report <br /> https://skyhook.berkeleybop.org/noctua-models-migrations/reports/
- [ ] Prep ticket for next outage
- [ ] Declare the optional items for this outage (`just declare`; none is fine): pinned NEO build / model fix migrations / go-cam-drop-box models
- [ ] Confirm run of NEO build (needs to be done early); if the inputs changed (e.g. a GPI format change), check what is in the build, not just that it ran
- [ ] Ensure copy of NEO for backup exists; stash if NEO build good (skyhook)<br />`just skyhook-stash` — or `just neo-pin <date>` to serve an earlier stash instead (expires at the next Jenkins build; note on next ticket)
- [ ] Refresh minerva code with latest from minerva `master`
- [ ] Add go-cam-drop-box models, if any (`port-preflight`, then `port-models` before the journal build; removal PR + `PROMOTIONS.md` entry afterwards)
- [ ] Run `replaced_by` term update on blazegraph SOP (@vanaukenk)
- [ ] Run model fix migrations using [SOP](https://github.com/geneontology/noctua-models-migrations/blob/main/README.md)—PRs merged to `main` beforehand; snapshot the journal, dump blazegraph and git commit before and after each SPARQL update (so that diffs can be independently checked)
  - [ ] (migration PRs)
- [ ] Update NEO (before minerva comes back up)
- [ ] Cycle minerva to get latest ontology
- [ ] restart barista (and noctua)
- [ ] Write up the outage: `events/noctua-outages/<date>.md` in operations
- [ ] Check git push (next day)

The following issues/PRs will be addressed in this outage:

- [ ]
