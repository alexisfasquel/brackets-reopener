/*!
     * Brackets Git Extension
 *
 * @author Martin Zagora
 * @license http://opensource.org/licenses/MIT
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */


//TODO Handle 2 files with same name in recent files list (add the folder => \ud83d\udcc1)
/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    "use strict";

    
    
    //TODO ?? Create list as the Working Files set where we store opened standelone files ?
    
    //Definistion of the size of the stack
    var MAX_LENGHT = 10;
    
    // Definition of the Command vars
    var REOPEN_CMD_ID   = "alexisfasquel.reopener.reopen",
        REOPEN_CMD_TEXT = "Reopen Closed Tab",
        REOPEN_CMD_KEY  = "Ctrl-Alt-W";
    
    // Constante defining the base of the ID 
    // Each recent file will have a unique conmmand ID constructed by concatenating its filename to this base
    var RECENT_CMD_BASE_ID   = "alexisfasquel.reopener.openrecent.",
        RECENT_TITLE_TEXT = "Open Recent :",
        RECENT_TITLE_CMD =  "alexisfasquel.reopener.openrecent";
    
    // Getting module dependencies.
    var DocumentManager     = brackets.getModule("document/DocumentManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        FileViewController  = brackets.getModule("project/FileViewController"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        Commands            = brackets.getModule("command/Commands"),
        Menus               = brackets.getModule("command/Menus"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        AppInit             = brackets.getModule("utils/AppInit");
    
    
    // Getting PreferenceStorage
    var _prefs = PreferencesManager.getPreferenceStorage(module, null);
    
    
    
    //The FileEntry stack where we'll be storig the FileEntries of the latest closed files
    //This array may contains FileEntry objects or FileEntry Arrays (Close/Close All)
    var _closedFiles = new Array();
    
    //TODO Comment
    //Initialisation in the _initRecents() function
    var _recentStandelones  = new Array();

    
    
    /**
     * 
     * TODO Comments
     * @param {?string} event - which is either "workingSetRemove" or "workingSetRemoveList"
     */
    function _removeDuplicate(fileEntries) {
        
        var i, j;
        if ($.isArray(fileEntries)) {       //If we have a list..
            
            fileEntries.sort();     // Sorting the array to avoid ordering issues later
            for (i = 0; i < _closedFiles.length; i++) {
                //Checking for an array in the stack of closedFiles
                if ($.isArray(_closedFiles[i])) {
                    //Yay ! Next, finding out if the two lists are identical
                    var isDuplicate = false,
                        list = _closedFiles[i];
                    for (j = 0; j < list.length; j++) {
                        if (list[j].fullPath !== fileEntries[j].fullPath) {
                            break;
                        }
                        isDuplicate = true;
                    }
                    //If they are, just have to remove it from the list and we're done
                    if (isDuplicate) {
                        _closedFiles.splice(i, 1);
                        break;
                    }
                }
            }
        } else {    //One file only...
            for (i = 0; i < _closedFiles.length; i++) {
                try {
                    if (_closedFiles[i].fullPath === fileEntries[i].fullPath) {
                        //Found the duplicate, removing it and moving on
                        _closedFiles.splice(i, 1);
                        break;
                    }
                } catch (e) { }
            }
        }
        
    }
    
    
    
    /**
     * Handler for the capture of closed file(s) events.
     * Store the path of the closed file(s) in a stack
     *
     * @param {?string} event - which is either "workingSetRemove" or "workingSetRemoveList"
     * @param {?FileEntry} closedFiles - will contains the closed file(s) => can be an array
     */
    function _saveClosedFiles(event, newClosedFiles) {
        
        // If new file (no fullPath) don't add!
        try {
			if (newClosedFiles.fullPath.substring(0, 10) === "/_brackets") {
                return;
            }
		} catch (e) { } // In case it's a list, then it can't be a new file
		
        // Removing duplicate if there is one
        _removeDuplicate(newClosedFiles);
        // Then pushing in the stack
        _closedFiles.push(newClosedFiles);
        
        // Checking that the command have not already been enabled
        if (!CommandManager.get(REOPEN_CMD_ID).getEnabled()) {
            //Otherwise : enable
            CommandManager.get(REOPEN_CMD_ID).setEnabled(true);
        }
        
        //If the stack is crowded
        if (_closedFiles.length > MAX_LENGHT) {
            _closedFiles.shift();   // kill someone (haha)
        }
    }
    
    
    
    /**
     * Reopen the last closed file(s)
     */
    function _reopen() {
        //Getting the last closed file(s)
        var lastClosed = _closedFiles.pop();
        //Adding it/them to the working files' list
        if ($.isArray(lastClosed)) {
            DocumentManager.addListToWorkingSet(lastClosed);
        } else {
            FileViewController.addToWorkingSetAndSelect(lastClosed.fullPath, FileViewController.WORKING_SET_VIEW);
        }
        //If the list is empty after the 'poping' then disable the command
        if (_closedFiles.length === 0) {
            CommandManager.get(REOPEN_CMD_ID).setEnabled(false);
        }
    }

    /**
     *  TODO Comment
     */
    function _reinit() {
        _closedFiles = new Array();
        CommandManager.get(REOPEN_CMD_ID).setEnabled(false);
    }
    
    
    
    /**
     * Reopen the last closed file(s)
     */
    function _openRecent() {
        var commandId = (this).getID();
        var i;
        for (i = 0; i < _recentStandelones.length; i++) {
            if (_recentStandelones[i].cmd === commandId) {
                FileViewController.addToWorkingSetAndSelect(_recentStandelones[i].fullPath, FileViewController.WORKING_SET_VIEW);
                break;
            }
        }
    }
    
    /**
     *  TODO: Comment
     */
    function _addRecent(event, FileEntry) {
        var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
        
        // First thing first, if new file (no fullPath) or within project, don't add!
        if (ProjectManager.isWithinProject(FileEntry.fullPath) || FileEntry.fullPath.substring(0, 10) === "/_brackets") {
            return;
        }
        
        // Converting to FileEntry to a "RecentStandelone Object"
        var standelone = {
            fullPath: FileEntry.fullPath,
            cmd: RECENT_CMD_BASE_ID + FileEntry.name,
            name: "\ud83d\udcc4  " + FileEntry.name
        };
        
        // Removing duplicate if there is one
        var i;
        for (i = 0; i < _recentStandelones.length; i++) {
            if (standelone.fullPath === _recentStandelones[i].fullPath) {
                menu.removeMenuItem(_recentStandelones[i].cmd);
                _recentStandelones.splice(i, 1);
                break;
            }
        }
        // Then pushing in the stack
        _recentStandelones.push(standelone);
        
        // Registering command and adding MenuItem
        CommandManager.register(standelone.name, standelone.cmd, _openRecent);
        menu.addMenuItem(standelone.cmd, "", Menus.AFTER, RECENT_TITLE_CMD);
        
        // The stack is crowded ? 
        if (_recentStandelones.length > 5) {
            var removed = _recentStandelones.shift(); // Kill someone, again!
            menu.removeMenuItem(removed.cmd);
            //TODO Unregister command ?
        }
    }
    
    
    //TODO COMMENT !!
    function _initRecents() {
        
        //Converting the Object return by the getAllValues function into an array (pushed in _recentStandelones)
        _recentStandelones = $.map(_prefs.getAllValues(), function (value, index) {
            return [value];
        });
        
        var i;
        for (i = 0; i < _recentStandelones.length; i++) {
            var standelone = _recentStandelones[i];
            
            CommandManager.register(standelone.name, standelone.cmd, _openRecent);
            var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
            menu.addMenuItem(standelone.cmd, "", Menus.AFTER, RECENT_TITLE_CMD);
        }
    }
    
    //TODO COMMENT !!
    function _saveRecents() {
        _prefs.setAllValues(_recentStandelones, false);
    }
    
    
    // Register command and add it to the menu.
    var command = CommandManager.register(REOPEN_CMD_TEXT, REOPEN_CMD_ID, _reopen);
    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
	menu.addMenuItem(REOPEN_CMD_ID, REOPEN_CMD_KEY, Menus.AFTER, Commands.FILE_CLOSE_ALL);
    
    //TODO COMMENT !!
    /*command = CommandManager.register(RECENT_TITLE_TEXT, RECENT_TITLE_CMD, _openRecent);
    command.setEnabled(false);
    menu.addMenuItem(RECENT_TITLE_CMD, '', Menus.AFTER, REOPEN_CMD_ID);
    menu.addMenuDivider(Menus.BEFORE, RECENT_TITLE_CMD);
    */

    
    
    AppInit.appReady(function () {
        //_initRecents();
        
        
        //Listening for project opening (at least one when the root project is opened)
        $(ProjectManager).on("projectOpen", _reinit);
        
        //TODO COMMENT !!
        $(DocumentManager).on("workingSetRemove", _saveClosedFiles);
        $(DocumentManager).on("workingSetRemoveList", _saveClosedFiles);
        
        //$(DocumentManager).on("workingSetAdd", _addRecent);
        
        
        //$(ProjectManager).on("beforeAppClose", _saveRecents);
    });

});
