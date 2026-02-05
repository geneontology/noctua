---
name: Software update issue
about: Create a new software update issue
title: 'Software update: 20YY-MM-DD'
labels: ''
assignees: kltm, vanaukenk

---

- [ ] Send email to go-consortium mailing list prior to software update to communicate what changes will go in (Tuesday before)
- [ ] Update noctua-visual-pathway-editor workbench
        
  ```bash
  cd noctua-visual-pathway-editor
  git pull origin master
  ```
- [ ] Update noctua-landing-page workbench
        
  ```bash
  cd noctua-landing-page
  git pull origin master        
  ```

- [ ] Update standard-annotation-editor workbench
        
  ```bash
  cd ???
  git pull origin master        
  ```

- [ ] Announce changes on production on Thursdays at 12:30pm PST
- [ ] Add software updates to Release Notes in Noctua User Guide
- [ ] If needed, document changes on Noctua User Guide

---

**Project: 

The following issues/PRs will be addressed in this outage:
- [ ] 1 
- [ ] 2


### Tests (high level)
- [ ] 1
- [ ] 2


cc @pgaudet @vanaukenk @kltm @thomaspd
