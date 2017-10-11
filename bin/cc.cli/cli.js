/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.cli.0.2.0/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.cli.0.2.0/";
    define.parameters.pkx = {
        "name": "cc.cli",
        "version": "0.2.0",
        "title": "CLI Package",
        "description": "Library for processing command line interface parameters..",
        "license": "Apache-2.0",
        "pkx": {
            "main": "cli.js",
            "dependencies": [
                "cc.string.0.2",
                "cc.type.0.2"
            ]
        }
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration", "requirer" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.string.0.2/"));
    define.parameters.dependencies.push(define.cache.get("cc.type.0.2/"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.cli
    //
    //    Library for processing command line interface parameters.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    ///////////////////////////////////////////////////////////////////////////////////////////// 
    var type;
    var string;
    
    var REGEX_MATCH_CLI_HELP = /([-a-zA-Z0-9]+)|\[(.*?)\]|<(.*?)>/g;
    var REGEX_MATCH_SQBRSPACE = /^( )*\[( )*|( )*\]( )*$/g;
    var REGEX_MATCH_TRBRSPACE = /^( )*<( )*|( )*>( )*$/g;
    
    var OPTION_PREFIX = "--";
    var HELP_CMD = "CMD";
    var HELP_OPT = "OPT";
    var HELP_HINT = "Type '$" + HELP_CMD + " " + OPTION_PREFIX + "help' for detailed information on how to use this command.";
    var HELP_OPTION = OPTION_PREFIX + "help";
    var HELP_MARGIN = Array(4).join(" ");
    
    function splitGroups(c) {
        if (!c) {
            c = "";
        }
        var params = c.match(REGEX_MATCH_CLI_HELP);
        var groups = {"raw": [], "words": [], "mandatory": [], "optional": [], "options": []};
        for (var p in params) {
            groups.raw[p] = params[p];
            switch (params[p].substr(0, 1)) {
                case "<":
                    groups.mandatory[p] = params[p].replace(REGEX_MATCH_TRBRSPACE, "");
                    break;
                case "-":
                    groups.options[p] = params[p];
                    break;
                case "[":
                    groups.optional[p] = params[p].replace(REGEX_MATCH_SQBRSPACE, "");
                    break;
                default:
                    groups.words[p] = params[p].replace(REGEX_MATCH_TRBRSPACE, "");
                    break;
            }
        }
    
        return groups;
    }
    function getUsageParameters(command) {
        var usage = (command.options && command.options.length > 0 ? " [options]" : "") + (command.commands && command.commands.length > 0 ? " [command]" : "");
        for (var m in command.mandatory) {
            usage += " <" + command.mandatory[m] + ">";
        }
        for (var m in command.optional) {
            usage += " [" + command.optional[m] + "]";
        }
        return usage;
    }
    
    var TextTable = function (matchTable) {
        var self = this;
    
        var rows = [];
        var layout = [];
        var offset = 0;
        var hSpacing = 3;
        var vSpacing = 0;
    
        this.margin = "";
        this.keepRight = 0;
    
        this.setHorizontalSpacing = function (s) {
            hSpacing = s;
        };
        this.setVerticalSpacing = function (s) {
            vSpacing = s;
        };
    
        this.getOffset = function (o) {
            return offset;
        };
        this.setOffset = function (o) {
            offset = o;
            self.updateLayout();
        };
    
        /* this.matchLayout = function(t) {
         matchTable = t;
         };*/
        this.setLayout = function (l) {
            layout = l;
            /*if (matchTable) {
             matchTable.setLayout(layout);
             }*/
        };
        this.getLayout = function (l) {
            return layout;
        };
        this.updateLayout = function (columnIdx) {
            var uRows = self.getRows(true);
            if (!columnIdx) {
                columnIdx = 0;
            }
    
            // get length for column
            var colLength = layout[columnIdx] ? layout[columnIdx] - hSpacing : 0;
            var hasRows = false;
            for (var i in uRows) {
                hasRows = hasRows || uRows[i][columnIdx] || uRows[i][columnIdx] === "";
                colLength = uRows[i][columnIdx] && uRows[i][columnIdx].length > colLength ? uRows[i][columnIdx].length : colLength;
            }
            if (hasRows) {
                layout[columnIdx] = colLength + hSpacing;
    
                self.updateLayout(columnIdx + 1);
            }
    
            /*if (columnIdx === 0 && matchTable) {
             matchTable.setLayout(layout);
             }*/
        };
    
        this.getRows = function (withMatchTable) {
            var uRows = rows.slice();
            if (offset > 0 && matchTable) {
                for (var r in uRows) {
                    var oArr = Array(offset);
                    for (var o in oArr) {
                        oArr[o] = "";
                    }
                    uRows[r] = oArr.concat(uRows[r]);
                }
    
                /*if (withMatchTable) {
                 uRows = uRows.concat(matchTable.getRows(true));
                 }*/
            }
    
            var colLength = 0;
            for (var u in uRows) {
                colLength = uRows[u].length > colLength ? uRows[u].length : colLength;
            }
            uRows = uRows.map(function (row) {
                if (row.length < colLength && self.keepRight > 0) {
                    row.splice(row.length - self.keepRight, 0, Array(colLength - row.length));
                }
                return row;
            });
    
            return uRows;
        };
        this.addRow = function (arr) {
            rows.push(arr);
            self.updateLayout();
        };
    
        this.print = function (noprint) {
            var text = "";
            var uRows = self.getRows();
            for (var r in uRows) {
                var rowStr = "";
    
                var row = uRows[r];
                if (row.length < layout.length && self.keepRight > 0) {
                    var oArr = [];
                    for (var o = 0; o < layout.length - row.length; o++) {
                        oArr = "";
                    }
                    row.splice(row.length - self.keepRight, 0, oArr);
                }
    
                for (var c = 0; c < row.length; c++) {
                    rowStr += string.padRight(row[c] || "", layout[c] || 0);
                }
                text += self.margin + rowStr + (vSpacing > 0 ? Array(vSpacing + 1).join("\n") : "") + "\n";
            }
    
            if (!noprint) {
                console.log(text);
            }
    
            return text;
        };
    };
    var Option = function (c, description) {
        var self = this;
    
        this.name = c && c.options ? c.options[0] : HELP_OPT;
        this.description = description;
        this.mandatory = [];
        this.optional = [];
    
        if (c) {
            var params = splitGroups(c);
            self.name = params.options[0] || self.name;
            self.mandatory = params.mandatory;
            self.optional = params.optional;
        }
    };
    
    var Interpreter = function (c, description, parent) {
        var self = this;
    
        this.name = c && c.words ? c.words[0] : HELP_CMD;
        this.description = description;
        this.commands = [];
        this.options = [];
        this.mandatory = [];
        this.optional = [];
        this.actions = [];
    
        if (c) {
            var params = splitGroups(c);
            self.name = params.words[0] || self.name;
            self.mandatory = params.mandatory;
            self.optional = params.optional;
        }
    
        this.displayHelp = function() {
            var text = "\nUsage: " + self.getFullName() + getUsageParameters(self) + "\n";
            if (self.description) {
                text += "\n" + self.description + "\n";
            }
            var tableCommands, tableOptions;
            // initialize table (for matching)
            if (self.commands.length > 0) {
                tableCommands = new TextTable();
            }
            if (self.options.length > 0) {
                tableOptions = new TextTable();
            }
    
            if (tableCommands) {
                tableCommands.margin = HELP_MARGIN;
                for (var c in self.commands) {
                    tableCommands.addRow([self.commands[c].name, getUsageParameters(self.commands[c]), self.commands[c].description]);
                }
            }
            if (tableOptions) {
                tableOptions = new TextTable();
                tableOptions.margin = HELP_MARGIN;
                for (var c in self.options) {
                    tableOptions.addRow([self.options[c].name, getUsageParameters(self.options[c]), self.options[c].description]);
                }
            }
            if (tableCommands) {
                text += "\nCommands:\n";
                text += tableCommands.print(true);
            }
            if (tableOptions) {
                text += "\nOptions:\n";
                text += tableOptions.print(true);
            }
            text += "\n";
            console.log(text);
            return text;
        };
    
        this.getFullName = function () {
            if (parent) {
                return parent.getFullName() + " " + self.name;
            }
            return self.name;
        };
    
        this.command = function (c, description) {
            var params = splitGroups(c);
            for (var i in self.commands) {
                if (self.commands[i].name === params.words[0]) {
                    return self.commands[i];
                }
            }
    
            var sub = new Interpreter(c, description, self);
            self.commands.push(sub);
            return sub;
        };
    
        this.option = function (c, description) {
            self.options.push(new Option(c, description));
            return self;
        };
    
        this.parameter = function (c) {
            if (c) {
                var params = splitGroups(c);
                self.name = params.words[0] || self.name;
                self.mandatory = params.mandatory;
                self.optional = params.optional;
            }
            return self;
        };
    
        this.action = function (fn) {
            self.actions.push(fn);
            return self;
        };
    
        this.parse = function (args) {
            if (!args) {
                args = [];
            }
            else if (self.name == HELP_CMD) {
                // first arg is name of command
                self.name = args[0];
            }
    
            var command = {};
    
            // check if help is needed
            if (args[1] === HELP_OPTION) {
                return { "--help" : self.displayHelp() };
            }
    
            // check next argument, if command, invoke parser
            for (var i in self.commands) {
                if (self.commands[i].name === args[1]) {
                    command[self.commands[i].name] = self.commands[i].parse(args.slice(1));
                    return command;
                }
            }
    
            // start parsing commands
            command.displayHelp = self.displayHelp;
            var pIdx = 0;
            var oIdx = 0;
            var hint = HELP_HINT.replace("$" + HELP_CMD, self.getFullName());
    
            for (var a = 1; a < args.length; a++) {
                var argument = a;
                var match = false;
                if (args[a].substr(0, 2) === OPTION_PREFIX) {
                    var option;
                    for (var o in self.options) {
                        if (self.options[o].name === args[a]) {
                            match = true;
                            option = args[a];
                            command[option] = {};
    
                            for (var m in self.options[o].mandatory) {
                                a++;
                                if (args[a] && args[a].substr(0, 2) !== OPTION_PREFIX) {
                                    command[option][self.options[o].mandatory[m]] = args[a];
                                }
                                else {
                                    console.log("Option '" + option + "' is missing mandatory parameter '" + self.options[o].mandatory[m] + "'. " + hint);
                                    return;
                                }
                            }
    
                            for (var m in self.options[o].optional) {
                                a++;
                                if (args[a] && args[a].substr(0, 2) !== "--") {
                                    command[option][self.options[o].optional[m]] = args[a];
                                }
                            }
                        }
                    }
    
                    if (option !== args[argument]) {
                        console.log("Invalid option '" + args[argument] + "'. " + hint);
                        return;
                    }
                }
                else {
                    var mCount = 0;
                    var mDone = true;
                    for (var m in self.mandatory) {
                        mCount++;
                        if (mCount - 1 < pIdx) {
                            continue;
                        }
    
                        if (args[a] && args[a].substr(0, 2) !== OPTION_PREFIX) {
                            match = true;
                            command[self.mandatory[m]] = args[a];
                            pIdx++;
                        }
                        else {
                            console.log("Mandatory parameter '" + self.mandatory[m] + "' is missing. " + hint);
                            return;
                        }
    
                        mDone = false;
                        break;
                    }
    
                    var oCount = 0;
                    if (mDone) {
                        for (var m in self.optional) {
                            oCount++;
                            if (oCount - 1 < oIdx) {
                                continue;
                            }
    
                            if (args[a] && args[a].substr(0, 2) !== OPTION_PREFIX) {
                                match = true;
                                command[self.optional[m]] = args[a];
                                oIdx++;
                            }
    
                            break;
                        }
                    }
                }
    
                if (!match) {
                    console.log("Unknown parameter '" + args[a] + "'. " + hint);
                    return;
                }
            }
    
            for (var a in self.actions) {
                self.actions[a](command);
            }
    
            return command;
        };
    };
    
    // module factory
    define(function() {
        if (!type) {
            type = require("cc.type");
        }
        if (!string) {
            string = require("cc.string");
        }
        return new Interpreter();
    });
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
