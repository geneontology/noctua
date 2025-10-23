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
- [ ] Ensure copy of NEO for backup exists
- [ ] Refresh minerva code with latest from minerva `master`
- [ ] Run `replaced_by` term update on blazegraph SOP (@vanaukenk)
- [ ] Cycle minerva to get latest ontology
- [ ] Update NEO
- [ ] Check git push (next day)

---

The following issues/PRs will be addressed in this outage:

- [ ] 1
- [ ] 2
