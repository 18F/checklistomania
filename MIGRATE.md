# Migrating Checklistomania

## Exporting from the E/W cloud.gov environment

 * Grab the MongoDB address and credentials:
    * Run `cf services`
    * In the output, look for the `mongodb26-swarm` hash, and from the
      `credentials` sub-hash, grab `dbname`, `hostname`, `port`, `username`
      and `password`
 * SSH into the existing instance: `cf-ssh -f manifests/MANIFEST_FOR_THIS_APP.yml`
    * Download Mongo to the instance:
        * `mkdir tmp; cd tmp`
        * `curl -O https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-3.4.2.tgz`
        * `tar -zxvf mongodb-linux-x86_64-3.4.2.tgz`
        * ```export PATH=`pwd`/mongodb-linux-x86_64-3.4.2/bin:$PATH```
    * Still in `tmp`, do the export: `mongodump -h HOST:PORT -u USERNAME -p PASSWORD -d DBNAME -o . --gz`

      This should create a folder in `tmp` named for the `DBNAME`, containing 
      seven `.gz` files.
    * Tar it all up into one file: `tar -cvf clom-export.tar DBNAME`
    * Don't quit the SSH session!
 * Back on your local machine:
    * `mkdir tmp; cd tmp` (inside the project folder)
    * Grab the name of the app created by `cf-ssh` - do `cf apps` and look for the 
      app name that ends in `-ssh`
    * `cf files APPNAME app/tmp/clom-export.tar | tail -n +4 > clom-export.tar`
    * `ls -l clom-export.tar` - make sure the file size is more than zero, otherwise
      something's gone wrong! (If this happens, use `cf files APPNAME` to explore the filesystem, as you may have the wrong path)

## Importing into the GovCloud environment

This process assumes that you already have a new shiny GovCloud environment space
with the app deployed and the Mongo service bound.

 * On your local machine:
    * Do the `cf login`/`cf target` dance to get to the new shiny space
    * `export IMPORT_APP_GUID=``cf app APPNAME --guid`` `
    * Grab the MongoDB address and credentials:
        * Run `cf services`
        * In the output, look for the `mongodb32` hash, and from the
          `credentials` sub-hash, grab `dbname`, `hostname`, `port`,
          `username` and `password`
    * Get a one-time authorization code: `cf ssh-code`
    * SFTP to the app instance: `sftp -P 2222 "cf:$IMPORT_APP_GUID/0@ssh.fr.cloud.gov"`
        * `cd tmp`
        * `put clom-export.tar`
        * `quit`
    * SSH in: `cf ssh APPNAME`
        * Download Mongo to the instance:
            * `cd tmp`
            * `curl -O https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-3.4.2.tgz`
            * `tar -zxvf mongodb-linux-x86_64-3.4.2.tgz`
            * ```export PATH=`pwd`/mongodb-linux-x86_64-3.4.2/bin:$PATH```
        * Untar the export: `tar -xvf clom-export.tar`
        * Now you have a folder named for the old database (`OLDDBNAME`). Don't       confuse this with the `NEWDBNAME` we took from the `mongo32` service above
        * If this database isn't empty, then you'll need to clear it first,
          as `mongorestore` won't update existing records.
            * Start the Mongo shell: `mongo HOST:PORT/NEWDBNAME -u USERNAME -p PASSWORD`
            * In the shell: `db.checklists.drop(); db.items.drop(); db.users.drop();` (should return `true`)
            * `db.getCollectionNames()` should now return empty: `[ ]`
        * Restore the export: `mongorestore -h HOST:PORT -u USERNAME -p PASSWORD -d   NEWDBNAME --gzip OLDDBNAME`
        * This should result in several `reading` and `restoring` messages, finally ending with `done`.


