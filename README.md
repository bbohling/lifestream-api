# Lifestream API

A [Sails v1](https://sailsjs.com) application. Currently just an app that ingests Strava data and provides an API to support stuff like [uebersicht](https://github.com/felixhageloh/uebersicht)).

## API

* `/v1/ingest/:userId[?getAll=true]`
* `/v1/activities`
---

## Links

+ [Sails framework documentation](https://sailsjs.com/get-started)
+ [Version notes / upgrading](https://sailsjs.com/documentation/upgrading)
+ [Deployment tips](https://sailsjs.com/documentation/concepts/deployment)
+ [Community support options](https://sailsjs.com/support)
+ [Professional / enterprise options](https://sailsjs.com/enterprise)


## Version info

This app was originally generated on Fri Dec 28 2018 08:21:20 GMT-0800 (PST) using Sails v1.1.0.

## TODO

- [x] Partial vs. Full ingestion
- [ ] Cycling Progress
- [x] Ingest all activities (not just cycling)
- [ ] Error handling
- [ ] Proper logging
- [ ] Web page with basic reports

<!-- Internally, Sails used [`sails-generate@1.16.4`](https://github.com/balderdashy/sails-generate/tree/v1.16.4/lib/core-generators/new). -->



<!--
Note:  Generators are usually run using the globally-installed `sails` CLI (command-line interface).  This CLI version is _environment-specific_ rather than app-specific, thus over time, as a project's dependencies are upgraded or the project is worked on by different developers on different computers using different versions of Node.js, the Sails dependency in its package.json file may differ from the globally-installed Sails CLI release it was originally generated with.  (Be sure to always check out the relevant [upgrading guides](https://sailsjs.com/upgrading) before upgrading the version of Sails used by your app.  If you're stuck, [get help here](https://sailsjs.com/support).)
-->

