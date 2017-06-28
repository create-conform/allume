# allume
A cross-platform bootloader for javascript runtimes.

# STATE

Working, but profile configurations & operations are not working yet. 

```

Usage: allume [options] [command] <selector>

Commands:
   profile    [command]   Performs configuration profile operations.   

Options:
   --repo                     <url>        Overrides the main repository for the active profile.               
   --theme                    <url>        Loads the specified css theme (only in browser).                    
   --config                   <json>       A JSON object with parameters for the package module loaded.        
   --profile                  <name>       Overrides the active profile.                                       
   --gh-username              <username>   Overrides the global configuration GitHub username key.             
   --gh-password              <password>   Overrides the global configuration GitHub password key.             
   --gh-token                 <token>      Overrides the global configuration GitHub token key.                
   --gh-branch                <branch>     Overrides the global configuration GitHub branch key.               
   --gh-enable-pre-release    <enable>     Overrides the global configuration GitHub enable pre-release key.   

```

#nwjs

Currently stuck on 0.20.1 because of this issue:
https://github.com/nwjs/npm-installer/issues/56