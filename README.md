# allume
A cross-platform bootloader for javascript runtimes.

```
INSTALL

   npm install allume -g


USAGE

   allume  [command] [selector] [options]


DESCRIPTION

   Cross-runtime (browser, node.js, ...) ready-to-go bootloader for loading packages.


COMMANDS

           serve     [port]                      Starts a very basic http server in the current folder.
                                                 If the port is not specified, 8080 is used.

           profile   list                        Lists all of the profiles available in the configuration.

                     add      <name>             Add a new profile.

                     remove   <name>             Removes the profile with the given name.

                     current                     Displays the name of the active profile.

                     switch   <name>             Activates the profile with the given name.

                     set      <key>   <value>    Sets the key value combination in the active profile.


OPTIONS

            --repo   <url>                       Overrides the main repository for the active profile.

            --theme  <url>                       Loads the specified css theme (only in browser).
```
