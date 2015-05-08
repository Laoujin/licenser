**========================  
== LICENSE GENERATOR ==  
========================**  
Choosing an OSS license doesn’t need to be scary...  
Visit: [http://choosealicense.com/](http://choosealicense.com/)

## Installation
```
$ npm install -g licenser
```

## Usage
In your project directory root:
```
# Create or update LICENSE file from package.json
$ licenser set

# Create or update LICENSE file and update package.json
$ licenser set apache2
$ licenser set mit
$ licenser set gpl3

# Update the year in the LICENSE file
$ licenser update
```

## Config
If a `package.json` is present at the working directory, author,
project and license information is read from there.  
If not author information is read from `~/.gitconfig`

Your default license and author data can be set globally:
```
$ licenser config --author="Mr. Fancy Pants" --email="fp@adventure.com"
$ licenser config --default-name="LICENSE.txt" --license=CC-BY-NC-4.0 
```
You can also edit `config.json` directly.


## Other Commands
The command line parameters are parsed by [nomnom](https://github.com/harthur/nomnom), so you can use
`licenser -h` for information about the available commands and also
`licenser set -h` for help on a specific command.

```
# Find you a license
$ licenser list -v # Verbose output for the most commonly used licenses
$ licenser list -c # Creative Commons licenses
$ licenser list open --osi # All OSI approved licenses matching 'open'

# Output license text to console
$ licenser print gpl3
$ licenser print gpl3 --header
```