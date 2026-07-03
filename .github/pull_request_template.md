`This is the template for the contribution message for user's to follow. `

Copy below to use as the template for your contribution message.

---

### Contribution Type
<!-- Please check ALL that apply by putting an 'x' inside the brackets: [x] -->
- [ ] Bug Fix
- [ ] New Feature
- [ ] Documentation Update
- [ ] Code Refactoring
- [ ] Structural / Architecture Changes

### Change Logs
<!-- 
MANDATORY ACTION KEYWORDS: 
Created, Added, Changed, Modified, Restructured, Deleted, Removed, Fixed, Completed, Finished, Miscellaneous, "Custom Keyword that is sensible"
-->

```
@ LOG : [Your Name]
# [Action Key Word] :
- [File/Component Name] : What occurred here.
- [File/Component Name] : What occurred here.

Description:
    [Short description of this action block (Optional)]

# [Action Key Word] :
- [File/Component Name] : What occurred here.

Description:
    [Short description of this action block (Optional)]
```

---


### Example of a proper contribution message:
---

### Contribution Type
   -  [ ] Bug Fix
   -  [ ] New Feature
   -  [ ] Documentation Update
   -  [x] Code Refactoring
   -  [x] Structural / Architecture Changes

### Change Logs

```
@ LOG : Alex Russo 
# Created :

    src/managers/app_manager.cpp : Bare skeleton only to handle the primary application loop.

    src/managers/server_manager.cpp : Handles multiple parallel incoming socket connections.

# Restructured :

    main.cpp : Cleaned and abstracted setup mechanics directly into the app manager interface.

Description:
Try to avoid changing main.cpp moving forward. Use only the app manager interface to execute
required core logic. Create your own respective managers and initialize them within the app manager.
Modified :

    Makefile : Appended the necessary compile flags for linking native thread libraries.
```
