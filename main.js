/*!
 * Brackets Git Extension
 *
 * @author Martin Zagora
 * @license http://opensource.org/licenses/MIT
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    "use strict";

    // Definition of the Command vars
    var REOPEN_CMD_ID   = "reopener.reopen",
        REOPEN_CMD_TEXT = "Reopen Closed Tab",
        REOPEN_CMD_KEY  = "Ctrl-Alt-W";
    
    // Getting module dependencies.
    var CommandManager      = brackets.getModule("command/CommandManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        FileViewController  = brackets.getModule("project/FileViewController"),
        Menus               = brackets.getModule("command/Menus"),
        Commands            = brackets.getModule("command/Commands"),
        AppInit             = brackets.getModule("utils/AppInit");
    
    //The filepath stack where we'll be storig the path of the latest closed files
    var PathStack = new Array();
    

    /**
     * Handler for the capture of closed file(s) events.
     * Store the path of the closed file(s) in a stack
     *
     * @param {?string} event - which is either "workingSetRemove" or "workingSetRemoveList"
     * @param {?FileEntry} closedFiles - will contains the closed file(s) => can be an array
     */
    function _saveClosedPath(event, closedFiles) {
        if ($.isArray(closedFiles)) {
            var i, filesPath = new Array();
            for (i = 0; i < closedFiles.length; i++) {
                filesPath.push(closedFiles[i].fullPath);
            }
            PathStack.push(filesPath);

        } else {
            PathStack.push(closedFiles.fullPath);
        }
        
        if (PathStack.length > 0) {
            CommandManager.get(REOPEN_CMD_ID).setEnabled(true);
        }
    }
    
    /**
     * Reopen the last closed file(s)
     */
    function _reopen() {
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
            CommandManager.get(REOPEN_CMD_ID).setEnabled(false);
        }
    }

    // Register command and add it to the menu.
    var command = CommandManager.register(REOPEN_CMD_TEXT, REOPEN_CMD_ID, _reopen);
    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
	menu.addMenuItem(REOPEN_CMD_ID, REOPEN_CMD_KEY, Menus.AFTER, Commands.FILE_CLOSE_ALL);
    
    //
    $(DocumentManager).on("workingSetRemove", _saveClosedPath);
    $(DocumentManager).on("workingSetRemoveList", _saveClosedPath);
    
    // --- When app ready... ---
    AppInit.appReady(function () {
        // ...Disable the the command
        CommandManager.get(REOPEN_CMD_ID).setEnabled(false);

    });
    
    
});
