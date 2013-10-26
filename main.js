/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    "use strict";

    var REOPEN_CMD = "quicky.reopen";   // package-style naming to avoid collisions
    
    var CommandManager = brackets.getModule("command/CommandManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        FileViewController = brackets.getModule("project/FileViewController"),
        Menus = brackets.getModule("command/Menus"),
        Commands        = brackets.getModule("command/Commands"),
        AppInit             = brackets.getModule("utils/AppInit");
    
    var PathStack = new Array();
    
    function saveFilesPath(event, closedFiles) {
        var i;
        var filesPath = new Array();
        for (i = 0; i < closedFiles.length; i++) {
            filesPath.push(closedFiles[i].fullPath);
        }
        PathStack.push(filesPath);
        
        if (PathStack.length > 0) {
            CommandManager.get(REOPEN_CMD).setEnabled(true);
        }
    }
    $(DocumentManager).on("workingSetRemoveList", saveFilesPath);
    
    function saveFilePath(event, closedFiles) {
        PathStack.push(closedFiles.fullPath);
        if (PathStack.length > 0) {
            CommandManager.get(REOPEN_CMD).setEnabled(true);
        }
    }
    $(DocumentManager).on("workingSetRemove", saveFilePath);
    
    function reopen() {
        var lastClosed = PathStack.pop();
        var i;
        if ($.isArray(lastClosed)) {
            for (i = 0; i < lastClosed.length; i++) {
                FileViewController.addToWorkingSetAndSelect(lastClosed[i], FileViewController.WORKING_SET_VIEW);
            }
        } else {
            FileViewController.addToWorkingSetAndSelect(lastClosed, FileViewController.WORKING_SET_VIEW);
        }
        if (PathStack.length === 0) {
            CommandManager.get(REOPEN_CMD).setEnabled(false);
        }
    }
    var command = CommandManager.register("Reopen Closed Tab", REOPEN_CMD, reopen);
    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
    menu.addMenuItem(REOPEN_CMD, "Ctrl-Alt-W", Menus.AFTER, Commands.FILE_CLOSE_ALL);
    
    
    //var command = CommandManager.register("Reopen Closed Tab", REOPEN_CMD, reopen);
    //var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
    //menu.addMenuItem(REOPEN_CMD, "Ctrl-Alt-W");
    // --- Initialize Extension ---
    AppInit.appReady(function () {
        CommandManager.get(REOPEN_CMD).setEnabled(false);
        
        
        
        // First, register a command - a UI-less object associating an id to a handler
    
        //CommandManager.get(REOPEN_CMD).setEnabled(false);
        //var command = CommandManager.register("Reopen Closed Tab", REOPEN_CMD, reopen);
        // Then create a menu item bound to the command
        // The label of the menu item is the name we gave the command (see above)
        //var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);

        // We could also add a key binding at the same time:
        //menu.addMenuItem(REOPEN_CMD, "Ctrl-Alt-W");
    
        //command.setEnabled(false);
        //exports.handleHelloWorld = handleHelloWorld;
    });
    
    
});