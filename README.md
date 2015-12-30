# Checklistomania
[![Build Status](https://travis-ci.org/18F/checklistomania.svg?branch=master)](https://travis-ci.org/18F/checklistomania)
[![Coverage Status](https://coveralls.io/repos/18F/checklistomania/badge.svg?branch=master&service=github)](https://coveralls.io/github/18F/checklistomania?branch=master)

This tool is a checklist manager with some neat-O features:
* Focus on what is actionable: central page is a simple list of things you can take action on now, in order of urgency.
* Checklists are centrally defined, allowing any member to subscribe to the authoritative checklist
* Checklist items deadlines can be set according to a fixed date or relative to completion of other items
* All members of team can view other peoples checklists, so admins can see everyone's status at a glance

# Requirements
- Mongodb
- nodejs

# Setup
Install dependecies with:
```
>>> npm install
```

Setup a github application to obtain a github client Id and secret Id by registering application [here](https://github.com/settings/applications/new), then run:
```
>>> export GITHUB_CLIENT_ID=<your_client_id>
>>> export GITHUB_CLIENT_SECRET=<your_client_secret>
```

Run locally with:
```
>>> npm start
```

And visit [http://localhost:3000/](http://localhost:3000/)

### Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
