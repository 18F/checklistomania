# Checklistomania
[![Build Status](https://travis-ci.org/18F/checklistomania.svg?branch=master)](https://travis-ci.org/18F/checklistomania)
[![Coverage Status](https://coveralls.io/repos/18F/checklistomania/badge.svg?branch=master&service=github)](https://coveralls.io/github/18F/checklistomania?branch=master)

This tool is a checklist manager with some neat-O features:
* Focus on what is actionable: central page is a simple list of things you can take action on now, in order of urgency.
* Checklists are centrally defined, allowing any member to subscribe to the authoritative checklist.
* Checklist items deadlines can be set according to a fixed date or relative to completion of other items.
* All members of team can view other peoples checklists, so admins can see everyone's status at a glance.

Here's some screenshots to give you a sense of the look & feel:

The tasks tab provides a centralized place for all your todo items:
![Todos](/public/img/tasks.png?raw=true "Tasks")

The checklists tab is where you assign yourself a new pre-defined checklist:
![Checklists](/public/img/checklists.png?raw=true "Checklists")

The users tab is where you can view the status of other team members action items, helpful if you want a hint or if you are an admin keeping track of where everyone is:
![Users](/public/img/users.png?raw=true "Users")

## Running Checklistomania
Checklistomania is a [Node.js](https://nodejs.org) application on the back-end, and its front-end is an [AngularJS](https://angularjs.org/) single-page application.

If you'd like to run Checklistomania for development purposes, follow these steps:

First, install Node.js ([Download page](https://nodejs.org/en/download/)) and MongoDB ([Installation instructions](https://docs.mongodb.com/manual/installation/)). Make sure you have the same version of Node.js as specified in `package.json`.

Clone Checklistomania and `cd` into its directory.

Install local Node.js dependencies with:
```shell
npm install
```

Checklistomania uses GitHub for user authentication. All users must be registered on GitHub and must be part of a GitHub organization. Users will need to set their organization membership to public (see instructions [here](https://help.github.com/articles/publicizing-or-hiding-organization-membership/)).

Specify GitHub application credentials as environment variables.
You can use the test credentials below, or create your own credentials [here](https://github.com/settings/applications/new) and set `GITHUB_ORG` to a GitHub organization name of your choice.
```shell
export GITHUB_CLIENT_ID=0a363c03ec2646619f57
export GITHUB_CLIENT_SECRET=01408892458c92e3514cd96cd6b31e6d91df25d2
export GITHUB_ORG=18F
export SESSION_SECRET=testSessionSecret
```

In production, make sure to set `SESSION_SECRET` to a long random string.

If you'd like to customize the look a little, you may specify a logo path and a header color (as a valid HTML hex code or color name) as environment variables as well, otherwise 18F brand defaults will be used:
```shell
export BRAND_LOGO_PATH=/private/img/18F-Logo-M.png
export BRAND_HEADER_COLOR=\#B3EFFF
```

You can also customize the port (which defaults to 3000) that the server listens on. If you do change it, make sure your registered GitHub callback matches the new port.
```shell
export PORT=3000
```

Make sure you have MongoDB running locally:
```shell
mongod
```

Run the Checklistomania application:
```shell
npm start
```

Visit [http://localhost:3000/](http://localhost:3000/) to see the locally running Checklistomania application.

## Testing
Make sure you have the same version of Node.js as specified in `package.json`, otherwise you may have trouble running the front end tests.

Run tests with:
```shell
npm test
```

## Deployment
For 18Fers: this is deployed on cloud.gov. Get started on cloud.gov by following the instructions [here](https://docs.cloud.gov/). Ask for more details in the #checklistomania channel in slack.

## Public domain
This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
