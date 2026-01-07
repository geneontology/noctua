---
name: Maintenance outage issue
about: Create a new outage issue
title: 'Maintenance outage: 20YY-MM-DD'
labels: ''
assignees: kltm, vanaukenk

---

- [ ] Send reminder email to go-consortium mailing list
- [ ] Run noctua-models-migration pipeline for (@vanaukenk) (automated to day before) to get report <br /> http://skyhook.berkeleybop.org/noctua-models-migrations/reports/
- [ ] Prep ticket for next outage
- [ ] Confirm run of NEO build (needs to be done early)
- [ ] Ensure copy of NEO for backup exists; stash if NEO build good (skyhook)<br />cp -r issue-35-neo-test issue-35-neo-test.\`date +%Y-%m-%d\`<br />cp go-lego-reacto.owl go-lego-reacto.owl.\`date +%Y-%m-%d\`
- [ ] Refresh minerva code with latest from minerva `master`
- [ ] Run `replaced_by` term update on blazegraph SOP (@vanaukenk)
- [ ] Cycle minerva to get latest ontology
- [ ] Update NEO
- [ ] Check git push (next day)
- [ ] TODO: What, if any, commands need to be run to update Noctua software
  - [ ] `git pull ???`

---

The following issues/PRs will be addressed in this outage:

- [ ] 1
- [ ] 2
