// Copyright (c) Microsoft Open Technologies, Inc.  All Rights Reserved. Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
// <reference path="ms-appx://$(TargetFramework)/js/base.js" />
// <reference path="ms-appx://$(TargetFramework)/js/ui.js" />
// <reference path="ms-appx://$(TargetFramework)/js/en-us/ui.strings.js" />
// <reference path="ms-appx://$(TargetFramework)/css/ui-dark.css" />
/// <reference path="../TestLib/util.ts"/>
///<reference path="../../bin/typings/tsd.d.ts" />
///<reference path="../TestLib/liveToQ/liveToQ.d.ts" />
///<reference path="../TestLib/winjs.dev.d.ts" />

module CorsicaTests {
    var Toolbar = <typeof WinJS.UI.PrivateToolbar> WinJS.UI.Toolbar;
    var Command = <typeof WinJS.UI.PrivateCommand> WinJS.UI.AppBarCommand;
    var Util = WinJS.Utilities;
    var Constants = {
        overflowModeAttached: "attached",
        overflowModeDetached: "detached",
        typeSeparator: "separator",
        typeContent: "content",
        typeButton: "button",
        typeToggle: "toggle",
        typeFlyout: "flyout",
        controlCssClass: "win-toolbar",
        disposableCssClass: "win-disposable",
        overflowAreaCssClass: "win-toolbar-overflowarea",
        attachedModeCssClass: "win-toolbar-attached",
        detachedModeCssClass: "win-toolbar-detached",
        emptyToolbarCssClass: "win-toolbar-empty",
        commandType: "WinJS.UI.AppBarCommand",
        secondaryCommandSection: "selection",
        commandSelector: ".win-command",
        overflowAttachedCommandHeight: 44,
        overflowAttachedSeparatorHeight: 12,
        detachedModeMinWidth: 100
    }

    function getVisibleCommandsInElement(element: HTMLElement) {
        var result = [];
        var commands = element.querySelectorAll(Constants.commandSelector);
        for (var i = 0, len = commands.length; i < len; i++) {
            if (getComputedStyle(<Element>commands[i]).display !== "none") {
                result.push(commands[i]);
            }
        }
        return result;
    }

    function verifyOverflowMenuContent(visibleElements: HTMLElement[], expectedLabels: string[]): void {
        var labelIndex = 0;
        for (var i = 0, len = visibleElements.length; i < len; i++) {
            if (visibleElements[i]["winControl"].type === Constants.typeSeparator) {
                LiveUnit.Assert.areEqual(expectedLabels[labelIndex], Constants.typeSeparator);
            } else {
                LiveUnit.Assert.areEqual(expectedLabels[labelIndex], visibleElements[i]["winControl"].label);
            }
            labelIndex++;
        }
    }

    export class ToolbarTests {
        "use strict";

        _element: HTMLElement;

        setUp() {
            LiveUnit.LoggingCore.logComment("In setup");

            var newNode = document.createElement("div");
            newNode.id = "host";
            document.body.appendChild(newNode);
            this._element = newNode;
        }

        tearDown() {
            if (this._element) {
                WinJS.Utilities.disposeSubTree(this._element);
                document.body.removeChild(this._element);
                this._element = null;
            }
        }

        testConstruction() {
            var toolbar = new Toolbar(this._element);
            LiveUnit.Assert.isTrue(Util.hasClass(toolbar.element, Constants.controlCssClass), "Toolbar missing control css class");
            LiveUnit.Assert.isTrue(Util.hasClass(toolbar.element, Constants.disposableCssClass), "Toolbar missing disposable css class");
        }

        testAttachedToDomAfterConstruction(complete) {
            this._element.style.width = "1000px";
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "opt 1" }),
                new Command(null, { type: Constants.typeButton, label: "opt 2" })
            ]);
            var toolbar = new Toolbar(null, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });
            var insertedHandler = function () {
                toolbar.element.removeEventListener("WinJSNodeInserted", insertedHandler);
                LiveUnit.Assert.areEqual(data.length, toolbar._primaryCommands.length, "Primary commands array has an invalid length");
                LiveUnit.Assert.areEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be hidden when the primary commands fit");
                LiveUnit.Assert.areEqual(0, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");
                complete();
            }

            toolbar.element.addEventListener("WinJSNodeInserted", insertedHandler);
            this._element.appendChild(toolbar.element);
        }

        testElementProperty() {
            var el = document.createElement("div");
            var toolbar = new Toolbar(el);
            LiveUnit.Assert.areEqual(Util._uniqueID(el), Util._uniqueID(toolbar.element), "The element passed in the constructor should be used as the main toolbar element");

            toolbar = new Toolbar();
            LiveUnit.Assert.isNotNull(toolbar.element, "An element should be created when one is not passed to the constructor");
        }

        testOverflowModeProperty() {
            // default (detached)
            var toolbar = new Toolbar();
            LiveUnit.Assert.areEqual(Constants.overflowModeDetached, toolbar.overflowMode, "The default overflowMode should be detached");
            LiveUnit.Assert.isTrue(Util.hasClass(toolbar.element, Constants.detachedModeCssClass), "Toolbar in detached mode is missing detached css class");
            LiveUnit.Assert.isFalse(Util.hasClass(toolbar.element, Constants.attachedModeCssClass), "Toolbar in detached mode should not have attached css class");

            // switch to attached.
            toolbar.overflowMode = Constants.overflowModeAttached;
            LiveUnit.Assert.areEqual(Constants.overflowModeAttached, toolbar.overflowMode, "OverflowMode should be attached");
            LiveUnit.Assert.isTrue(Util.hasClass(toolbar.element, Constants.attachedModeCssClass), "Toolbar in attached mode is missing attached css class");
            LiveUnit.Assert.isFalse(Util.hasClass(toolbar.element, Constants.detachedModeCssClass), "Toolbar in attached mode should not have detached css class");

            // switch back to detached
            toolbar.overflowMode = Constants.overflowModeDetached;
            LiveUnit.Assert.areEqual(Constants.overflowModeDetached, toolbar.overflowMode, "overflowMode should be detached");
            LiveUnit.Assert.isTrue(Util.hasClass(toolbar.element, Constants.detachedModeCssClass), "Toolbar in detached mode is missing detached css class");
            LiveUnit.Assert.isFalse(Util.hasClass(toolbar.element, Constants.attachedModeCssClass), "Toolbar in detached mode should not have attached css class");

            // set to invalid value
            try {
                toolbar.overflowMode = "invalid";
            } catch (e) {
                LiveUnit.Assert.areEqual("WinJS.UI.Toolbar.BadOverflowMode", e.name);
            } finally {
                LiveUnit.Assert.areEqual(Constants.overflowModeDetached, toolbar.overflowMode, "overflowMode should have not changed when set to an invalid value");
            }
        }

        testDataProperty() {
            // Verify default (empty)
            var toolbar = new Toolbar();
            LiveUnit.Assert.areEqual(0, toolbar.data.length, "Empty list view should have data with length 0");
            LiveUnit.Assert.isTrue(Util.hasClass(toolbar.element, Constants.emptyToolbarCssClass), "Empty toolbar css class that is not present");

            // Add some data
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "opt 1" }),
                new Command(null, { type: Constants.typeButton, label: "opt 2" })
            ]);
            toolbar.data = data;
            LiveUnit.Assert.areEqual(2, toolbar.data.length, "Toolbar data has an invalid length");
            LiveUnit.Assert.isFalse(Util.hasClass(toolbar.element, Constants.emptyToolbarCssClass), "Empty toolbar css class should not be present");

            // set to invalid value
            var property = "data";
            try {

                toolbar[property] = { invalid: 1 };
            } catch (e) {
                LiveUnit.Assert.areEqual("WinJS.UI.Toolbar.BadData", e.name);

                // Ensure the value of data did not change
                LiveUnit.Assert.areEqual(2, toolbar.data.length, "Toolbar data has an invalid length");
                LiveUnit.Assert.isFalse(Util.hasClass(toolbar.element, Constants.emptyToolbarCssClass), "Empty toolbar css class should not be present");
            }

            // if the toolbar element contains children, they should be parsed as the data

            var el = document.createElement("div");
            var child = document.createElement("table");
            el.appendChild(child);
            try {
                new Toolbar(el);
            } catch (e) {
                LiveUnit.Assert.areEqual("WinJS.UI.Toolbar.MustContainCommands", e.name, "Toobar should have thrown MustContainCommands exception");
            }

            el = document.createElement("div");
            var commandEl: HTMLElement;
            var numberOfCommands = 5;
            for (var i = 0; i < numberOfCommands; i++) {
                commandEl = document.createElement("button");
                commandEl.setAttribute("data-win-control", Constants.commandType);
                el.appendChild(commandEl);
            }
            toolbar = new Toolbar(el);
            LiveUnit.Assert.areEqual(numberOfCommands, toolbar.data.length, "Toolbar data has an invalid length");
            LiveUnit.Assert.isFalse(Util.hasClass(toolbar.element, Constants.emptyToolbarCssClass), "Empty toolbar css class should not be present");
        }

        testToolbarDispose() {
            var toolbar = new Toolbar();
            LiveUnit.Assert.isTrue(toolbar.dispose);
            LiveUnit.Assert.isFalse(toolbar._disposed);

            // Double dispose sentinel
            var sentinel: any = document.createElement("div");
            sentinel.disposed = false;
            WinJS.Utilities.addClass(sentinel, "win-disposable");
            toolbar.element.appendChild(sentinel);
            sentinel.dispose = function () {
                if (sentinel.disposed) {
                    LiveUnit.Assert.fail("Unexpected double dispose occured.");
                }
                sentinel.disposed = true;
            };

            toolbar.dispose();
            LiveUnit.Assert.isTrue(sentinel.disposed);
            LiveUnit.Assert.isTrue(toolbar._disposed);
            toolbar.dispose();
        }

        testVerifyDefaultTabIndex() {
            var toolbar = new Toolbar();
            LiveUnit.Assert.areEqual("-1", toolbar.element.getAttribute("tabIndex"), "Toolbar should've assigned a default tabIndex");

            var el = document.createElement("div");
            el.setAttribute("tabIndex", "4");
            toolbar = new Toolbar(el);
            LiveUnit.Assert.areEqual("4", toolbar.element.getAttribute("tabIndex"), "Toolbar should have not assigned a default tabIndex");
        }

        testAria() {
            var toolbar = new Toolbar();
            LiveUnit.Assert.areEqual("menubar", toolbar.element.getAttribute("role"), "Missing default aria role");
            LiveUnit.Assert.areEqual("Toolbar", toolbar.element.getAttribute("aria-label"), "Missing default aria label");

            var el = document.createElement("div");
            toolbar = new Toolbar(el);
            el.setAttribute("role", "list");
            el.setAttribute("aria-label", "myList");
            LiveUnit.Assert.areEqual("list", toolbar.element.getAttribute("role"), "Toolbar should have not set a default aria role");
            LiveUnit.Assert.areEqual("myList", toolbar.element.getAttribute("aria-label"), "Toolbar should have not set a default aria label");
        }

        testOverflowAreaVisibility() {
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeAttached
            });

            var overflowArea: HTMLElement;
            var child: HTMLElement;
            for (var i = 0, len = toolbar.element.children.length; i< len; i++) {
                child = <HTMLElement> toolbar.element.children[i];
                if (Util.hasClass(child, Constants.overflowAreaCssClass)) {
                    overflowArea = child;
                    break;
                }
            }

            LiveUnit.Assert.isNotNull(overflowArea, "Unabled to find overflow area element in attached mode");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(overflowArea).display, "Overflow area should not be hidden in attached mode");

            toolbar.overflowMode = Constants.overflowModeDetached;
            LiveUnit.Assert.areEqual("none", getComputedStyle(overflowArea).display, "Overflow area (attached) should be hidden in detached mode");
        }

        testOverflowDetachedOverflowButtonHidden() {
            this._element.style.width = "1000px";
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "opt 1" }),
                new Command(null, { type: Constants.typeButton, label: "opt 2" })
            ]);
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            LiveUnit.Assert.areEqual(data.length, toolbar._primaryCommands.length, "Primary commands array has an invalid length");
            LiveUnit.Assert.areEqual(0, toolbar._secondaryCommands.length, "Secondary commands array has an invalid length");
            LiveUnit.Assert.areEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be hidden when the primary commands fit");
        }

        testOverflowDetachedOverflowButtonVisibleForSecondaryCommand() {
            this._element.style.width = "1000px";
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "opt 1" }),
                new Command(null, { type: Constants.typeButton, label: "opt 2", section: Constants.secondaryCommandSection })
            ]);

            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            LiveUnit.Assert.areEqual(1, toolbar._primaryCommands.length, "Primary commands array has an invalid length");
            LiveUnit.Assert.areEqual(1, toolbar._secondaryCommands.length, "Secondary commands array has an invalid length");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be visible when there are secondary commands");
            LiveUnit.Assert.areEqual(1, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");
        }

        testOverflowDetachedOverflowButtonVisibleForPrimaryCommand() {
            this._element.style.width = "10px";
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "opt 1" }),
                new Command(null, { type: Constants.typeButton, label: "opt 2" })
            ]);
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            LiveUnit.Assert.areEqual(data.length, toolbar._primaryCommands.length, "Primary commands array has an invalid length");
            LiveUnit.Assert.areEqual(0, toolbar._secondaryCommands.length, "Secondary commands array has an invalid length");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be visible when the primary commands overflow");
        }

        testForceLayout() {
            this._element.style.width = "10px";
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "opt 1" }),
                new Command(null, { type: Constants.typeButton, label: "opt 2" })
            ]);
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            LiveUnit.Assert.areEqual(data.length, toolbar._primaryCommands.length, "Primary commands array has an invalid length");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be visible when the primary commands overflow");
            LiveUnit.Assert.areEqual(2, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");

            this._element.style.width = "1000px";
            toolbar.forceLayout();

            LiveUnit.Assert.areEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be hidden when the primary commands fit");
            LiveUnit.Assert.areEqual(2, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Main action area should have 2 commands");
            LiveUnit.Assert.areEqual(0, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");
        }

        testOverflowDetachedSeparatorAddedBetweenPrimaryAndSecondary() {
            this._element.style.width = "10px";
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "opt 1" }),
                new Command(null, { type: Constants.typeButton, label: "opt 2", section: Constants.secondaryCommandSection })
            ]);

            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            var overflowCommands = getVisibleCommandsInElement(toolbar._menu.element);
            LiveUnit.Assert.areEqual(3, overflowCommands.length, "Menu commands list has an invalid length");
            LiveUnit.Assert.areEqual("opt 1", overflowCommands[0].winControl.label);
            LiveUnit.Assert.areEqual(Constants.typeSeparator, overflowCommands[1].winControl.type);
            LiveUnit.Assert.areEqual("opt 2", overflowCommands[2].winControl.label);
        }

        testOverflowBehaviorOfCustomContentInDetachedMode() {
            var customEl = document.createElement("div");
            customEl.style.width = "2000px";
            customEl.style.height = "50px";

            var data = new WinJS.Binding.List([
                new Command(customEl, { type: Constants.typeContent, label: "1", extraClass: "c1" }),
            ]);

            this._element.style.width = "200px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            LiveUnit.Assert.areEqual(0, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be visible when a command overflow");
            LiveUnit.Assert.areEqual(1, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");

            // Custom content should overflow as a flyout menu item
            var menuCommand = <WinJS.UI.MenuCommand>(getVisibleCommandsInElement(toolbar._menu.element)[0]["winControl"]);
            LiveUnit.Assert.areEqual(Constants.typeFlyout, menuCommand.type, "Custom content should overflow with type flyout");
            LiveUnit.Assert.areEqual(toolbar._customContentFlyout, menuCommand.flyout, "Invalid flyout target for custom command in the overflow area");
            LiveUnit.Assert.areEqual("1", menuCommand.label, "Invalid label for custom command in the overflow area");
            LiveUnit.Assert.areEqual("c1", menuCommand.extraClass, "Invalid extraClass for custom command in the overflow area");
        }

        testOverflowBehaviorOfButtonCommandInDetachedMode() {
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "1", extraClass: "c1", disabled: true, onclick: getVisibleCommandsInElement }),
                new Command(null, { type: Constants.typeButton, label: "2", extraClass: "c2", disabled: true, onclick: getVisibleCommandsInElement }),
            ]);

            this._element.style.width = "10px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            LiveUnit.Assert.areEqual(0, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be visible when a command overflow");
            LiveUnit.Assert.areEqual(2, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");

            var menuCommand = <WinJS.UI.MenuCommand>(getVisibleCommandsInElement(toolbar._menu.element)[0]["winControl"]);
            LiveUnit.Assert.areEqual(Constants.typeButton, menuCommand.type, "Invalid menuCommand type");
            LiveUnit.Assert.isNull(menuCommand.flyout, "Flyout target for button should be null");
            LiveUnit.Assert.areEqual("1", menuCommand.label, "Invalid menuCommand label");
            LiveUnit.Assert.areEqual("c1", menuCommand.extraClass, "Invalid menuCommand extraClass");
            LiveUnit.Assert.isTrue(menuCommand.disabled, "Invalid menuCommand disabled property value");
            LiveUnit.Assert.areEqual(getVisibleCommandsInElement, menuCommand.onclick, "Invalid menuCommand onclick property value");
        }

        testOverflowBehaviorOfToggleCommandInDetachedMode() {
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeToggle, label: "1", extraClass: "c1", selected: true, onclick: getVisibleCommandsInElement }),
                new Command(null, { type: Constants.typeButton, label: "2", extraClass: "c2", disabled: true, onclick: getVisibleCommandsInElement }),
            ]);

            this._element.style.width = "10px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            LiveUnit.Assert.areEqual(0, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be visible when a command overflow");
            LiveUnit.Assert.areEqual(2, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");

            var menuCommand = <WinJS.UI.MenuCommand>(getVisibleCommandsInElement(toolbar._menu.element)[0]["winControl"]);
            LiveUnit.Assert.areEqual(Constants.typeToggle, menuCommand.type, "Invalid menuCommand type");
            LiveUnit.Assert.isNull(menuCommand.flyout, "Flyout target for button should be null");
            LiveUnit.Assert.areEqual("1", menuCommand.label, "Invalid menuCommand label");
            LiveUnit.Assert.areEqual("c1", menuCommand.extraClass, "Invalid menuCommand extraClass");
            LiveUnit.Assert.isFalse(menuCommand.disabled, "Invalid menuCommand disabled property value");
            LiveUnit.Assert.isTrue(menuCommand.selected, "Invalid menuCommand selected property value");
            LiveUnit.Assert.areEqual(getVisibleCommandsInElement, menuCommand.onclick, "Invalid menuCommand onclick property value");
        }

        testOverflowBehaviorOfToggleChangingValues() {
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeToggle, label: "1", extraClass: "c1", selected: true }),
                new Command(null, { type: Constants.typeButton, label: "2", extraClass: "c2", disabled: true  }),
            ]);

            this._element.style.width = "10px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });
            var menuCommand = <WinJS.UI.MenuCommand>(getVisibleCommandsInElement(toolbar._menu.element)[0]["winControl"]);
            LiveUnit.Assert.isTrue(menuCommand.selected, "Invalid menuCommand selected property value");

            // Deselect the toggle button in the menu
            var menuCommandEl = (<HTMLElement> toolbar._menu.element.children[0]);
            menuCommandEl.click();

            toolbar.element.style.width = 2* toolbar._standardCommandWidth + "px";
            toolbar.forceLayout();

            // Ensure that the command in the main action area now has the toggle de-selected
            var command = getVisibleCommandsInElement(toolbar._mainActionArea)[0];
            LiveUnit.Assert.isFalse(command.winControl.selected, "Invalid menuCommand selected property value");
        }

        testOverflowBehaviorOfFlyoutCommandInDetachedMode() {
            var flyout = new WinJS.UI.Flyout();
            this._element.appendChild(flyout.element);

            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeFlyout, label: "1", extraClass: "c1", flyout: flyout, onclick: getVisibleCommandsInElement }),
                new Command(null, { type: Constants.typeButton, label: "2", extraClass: "c2", disabled: true }),
            ]);

            this._element.style.width = "10px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            LiveUnit.Assert.areEqual(0, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be visible when a command overflow");
            LiveUnit.Assert.areEqual(2, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");

            var menuCommand = <WinJS.UI.MenuCommand>(getVisibleCommandsInElement(toolbar._menu.element)[0]["winControl"]);
            LiveUnit.Assert.areEqual(Constants.typeFlyout, menuCommand.type, "Invalid menuCommand type");
            LiveUnit.Assert.areEqual(flyout, menuCommand.flyout, "Invalid menuCommand flyout property value");
            LiveUnit.Assert.areEqual("1", menuCommand.label, "Invalid menuCommand label");
            LiveUnit.Assert.areEqual("c1", menuCommand.extraClass, "Invalid menuCommand extraClass");
            LiveUnit.Assert.isFalse(menuCommand.disabled, "Invalid menuCommand disabled property value");
            LiveUnit.Assert.areEqual(getVisibleCommandsInElement, menuCommand.onclick, "Invalid menuCommand onclick property value");
        }

        testOverflowBehaviorOfSeparatorCommandInDetachedMode() {
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "2", extraClass: "c2", disabled: true }),
                new Command(null, { type: Constants.typeSeparator }),
            ]);

            this._element.style.width = "10px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            LiveUnit.Assert.areEqual(0, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be visible when a command overflow");
            var menuCommand = toolbar._menu.element.querySelectorAll(Constants.commandSelector)[1]["winControl"];
            LiveUnit.Assert.areEqual(Constants.typeSeparator, menuCommand.type, "Invalid menuCommand type");
        }

        testOverflowBehaviorDefaultPriority() {
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "1" }),
                new Command(null, { type: Constants.typeSeparator, label: "2" }),
                new Command(null, { type: Constants.typeButton, label: "3" }),
                new Command(null, { type: Constants.typeButton, label: "4" }),
                new Command(null, { type: Constants.typeSeparator, label: "5" }),
                new Command(null, { type: Constants.typeButton, label: "6" }),
            ]);

            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            // Make sure everything fits, nothing should overflow
            this._element.style.width = (2 * toolbar._separatorWidth + 4 * toolbar._standardCommandWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(6, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be hidden when there is no overflow");

            // Force drop 1 command
            this._element.style.width = (2 * toolbar._separatorWidth + 3 * toolbar._standardCommandWidth + toolbar._overflowButtonWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(5 - 1 /* trailing separator is hidden */, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should not be hidden when there is overflow");
            LiveUnit.Assert.areEqual(1, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");

            // Force command back  in the main area
            this._element.style.width = (2 * toolbar._separatorWidth + 4 * toolbar._standardCommandWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(6, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be hidden when there is no overflow");
            LiveUnit.Assert.areEqual(0, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");

            // Force drop 2 commands
            this._element.style.width = (1 * toolbar._separatorWidth + 3 * toolbar._standardCommandWidth + toolbar._overflowButtonWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(4, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should not be hidden when there is overflow");
            LiveUnit.Assert.areEqual(2 - 1 /* leading separator is hidden */, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");

            // Force drop 3 commands
            this._element.style.width = (1 * toolbar._separatorWidth + 2 * toolbar._standardCommandWidth + toolbar._overflowButtonWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(3, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should not be hidden when there is overflow");
            LiveUnit.Assert.areEqual(3, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");

            // Force drop 4 commands
            this._element.style.width = (1 * toolbar._separatorWidth + 1 * toolbar._standardCommandWidth + toolbar._overflowButtonWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(2 - 1 /* trailing separator is hidden */, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should not be hidden when there is overflow");
            LiveUnit.Assert.areEqual(4, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");

            // Force drop 5 commands
            this._element.style.width = (0 * toolbar._separatorWidth + 1 * toolbar._standardCommandWidth + toolbar._overflowButtonWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(1, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should not be hidden when there is overflow");
            LiveUnit.Assert.areEqual(5 - 1 /* leading separator is hidden */, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");

            // Force drop 6 commands
            this._element.style.width = (0 * toolbar._separatorWidth + 0 * toolbar._standardCommandWidth + toolbar._overflowButtonWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(0, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should not be hidden when there is overflow");
            LiveUnit.Assert.areEqual(6, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");
        }

        testOverflowBehaviorDefaultPriorityWithCustomContent() {
            var customEl1 = document.createElement("div");
            customEl1.style.width = "200px";
            customEl1.style.height = "50px";

            var customEl2 = document.createElement("div");
            customEl2.style.width = "350px";
            customEl2.style.height = "50px";

            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "1" }),
                new Command(customEl1, { type: Constants.typeContent, label: "2" }),
                new Command(customEl2, { type: Constants.typeContent, label: "3" }),
            ]);

            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            var customContent1Width = toolbar._getCommandWidth(data.getAt(1));
            var customContent2Width = toolbar._getCommandWidth(data.getAt(2));

            // Make sure everything fits, nothing should overflow
            this._element.style.width = (toolbar._standardCommandWidth + customContent1Width + customContent2Width) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(3, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be hidden when there is no overflow");

            // Force drop 1 command
            this._element.style.width = (toolbar._standardCommandWidth + customContent1Width + toolbar._overflowButtonWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(2, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should not be hidden when there is overflow");
            LiveUnit.Assert.areEqual(1, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");

            // Force drop 2 commands
            this._element.style.width = (toolbar._standardCommandWidth + (customContent1Width - 1) + toolbar._overflowButtonWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(1, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should not be hidden when there is overflow");
            LiveUnit.Assert.areEqual(2, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");
        }

        testOverflowBehaviorCustomPriorityContentInFlyout(complete) {
            var createCustomElement = (text: string) => {
                var customEl = document.createElement("div");
                var customContent = document.createElement("div");
                customContent.style.width = "200px";
                customContent.style.height = "50px";
                customContent.innerHTML = text;
                customContent.style.backgroundColor = "red";
                customEl.appendChild(customContent);
                return customEl;
            }

            var data = new WinJS.Binding.List([
                new Command(createCustomElement("custom 1"), { type: Constants.typeContent, label: "1", priority: 5, section: Constants.secondaryCommandSection }),
                new Command(createCustomElement("custom 2"), { type: Constants.typeContent, label: "2", priority: 5, section: Constants.secondaryCommandSection }),
            ]);

            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            // Click on the first menu item
            toolbar._menu.show(toolbar._overflowButton, "autovertical", "right");
            var menuCommand = (<HTMLElement> toolbar._menu.element.children[0]);
            menuCommand.click();
            LiveUnit.Assert.areEqual("custom 1", toolbar._customContentContainer.textContent, "The custom content flyout has invalid content");

            var testSecondCommandClick = () => {
                toolbar._customContentFlyout.removeEventListener("afterhide", testSecondCommandClick);

                // Click on the second menu item
                toolbar._menu.show(toolbar._overflowButton, "autovertical", "right");
                menuCommand = (<HTMLElement> toolbar._menu.element.children[1]);
                menuCommand.click();
                LiveUnit.Assert.areEqual("custom 2", toolbar._customContentContainer.textContent, "The custom content flyout has invalid content");

                complete();
            };

            toolbar._customContentFlyout.addEventListener("afterhide", testSecondCommandClick);
            toolbar._customContentFlyout.hide();
        }

        testOverflowBehaviorCustomPriority() {
            var customEl = document.createElement("div");
            var customContent = document.createElement("div");
            customContent.style.width = "200px";
            customContent.style.height = "50px";
            customContent.innerHTML = "custom 2";
            customContent.style.backgroundColor = "red";
            customEl.appendChild(customContent);

            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "1", priority: 1 }),
                new Command(customEl, { type: Constants.typeContent, label: "2", priority: 5 }),
                new Command(null, { type: Constants.typeSeparator, priority: 2 }),
                new Command(null, { type: Constants.typeButton, label: "3", priority: 3 }),
                new Command(null, { type: Constants.typeButton, label: "4", priority: 2 }),
                new Command(null, { type: Constants.typeButton, label: "5", priority: 4 }),
                new Command(null, { type: Constants.typeSeparator, priority: 5 }),
                new Command(null, { type: Constants.typeButton, label: "6", priority: 5 }),
                new Command(null, { type: Constants.typeButton, label: "sec 1", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "sec 2", section: Constants.secondaryCommandSection }),
            ]);

            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            var customContentWidth = toolbar._getCommandWidth(data.getAt(1));

            // Make sure everything fits, nothing should overflow
            this._element.style.width = (2 * toolbar._separatorWidth + 5 * toolbar._standardCommandWidth + customContentWidth + toolbar._overflowButtonWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(8, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should be visble because there are secondary commands");
            LiveUnit.Assert.areEqual(2, getVisibleCommandsInElement(toolbar._menu.element).length, "Menu commands list has an invalid length");

            // Force drop priority 5 commands
            this._element.style.width = (2 * toolbar._separatorWidth + 5 * toolbar._standardCommandWidth + customContentWidth + toolbar._overflowButtonWidth - 1) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(5, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            var expectedMenuCommands = 6 /* 2 secondary commands + 1 separator + 2 primary commands with 1 separator */;
            var visibleMenuCommands = getVisibleCommandsInElement(toolbar._menu.element);
            LiveUnit.Assert.areEqual(expectedMenuCommands, visibleMenuCommands.length, "Menu commands list has an invalid length");
            verifyOverflowMenuContent(visibleMenuCommands, ["2", Constants.typeSeparator, "6", Constants.typeSeparator, "sec 1", "sec 2"]);

            // Force drop priority 4 commands
            this._element.style.width = (1 * toolbar._separatorWidth + 3 * toolbar._standardCommandWidth + toolbar._overflowButtonWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(4, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            var expectedMenuCommands = 7 /* 2 secondary commands + 1 separator + 3 primary commands with 1 separator */;
            var visibleMenuCommands = getVisibleCommandsInElement(toolbar._menu.element);
            LiveUnit.Assert.areEqual(expectedMenuCommands, visibleMenuCommands.length, "Menu commands list has an invalid length");
            verifyOverflowMenuContent(visibleMenuCommands, ["2", "5", Constants.typeSeparator, "6", Constants.typeSeparator, "sec 1", "sec 2"]);

            // Force drop priority 3 commands
            this._element.style.width = (1 * toolbar._separatorWidth + 2 * toolbar._standardCommandWidth + toolbar._overflowButtonWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(3, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            var expectedMenuCommands = 8 /* 2 secondary commands + 1 separator + 4 primary commands with 1 separator */;
            var visibleMenuCommands = getVisibleCommandsInElement(toolbar._menu.element);
            LiveUnit.Assert.areEqual(expectedMenuCommands, visibleMenuCommands.length, "Menu commands list has an invalid length");
            verifyOverflowMenuContent(visibleMenuCommands, ["2", "3", "5", Constants.typeSeparator, "6", Constants.typeSeparator, "sec 1", "sec 2"]);

            // Force drop priority 2 commands
            this._element.style.width = (toolbar._standardCommandWidth + toolbar._overflowButtonWidth) + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(1, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            var expectedMenuCommands = 10 /* 2 secondary commands + 1 separator + 5 primary commands with 2 separators */;
            var visibleMenuCommands = getVisibleCommandsInElement(toolbar._menu.element);
            LiveUnit.Assert.areEqual(expectedMenuCommands, visibleMenuCommands.length, "Menu commands list has an invalid length");
            verifyOverflowMenuContent(visibleMenuCommands, ["2", Constants.typeSeparator, "3", "4", "5", Constants.typeSeparator, "6", Constants.typeSeparator, "sec 1", "sec 2"]);

            // Force drop priority 1 commands
            this._element.style.width = toolbar._overflowButtonWidth + "px";
            toolbar.forceLayout();
            LiveUnit.Assert.areEqual(0, getVisibleCommandsInElement(toolbar._mainActionArea).length, "Invalid number of commands in the main action area");
            var expectedMenuCommands = 11 /* 2 secondary commands + 1 separator + 6 primary commands with 2 separator */;
            var visibleMenuCommands = getVisibleCommandsInElement(toolbar._menu.element);
            LiveUnit.Assert.areEqual(expectedMenuCommands, visibleMenuCommands.length, "Menu commands list has an invalid length");
            verifyOverflowMenuContent(visibleMenuCommands, ["1", "2", Constants.typeSeparator, "3", "4", "5", Constants.typeSeparator, "6", Constants.typeSeparator, "sec 1", "sec 2"]);
        }

        testDetachedModeMinWidth() {
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeContent, label: "1" }),
            ]);
            this._element.style.width = "10px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            LiveUnit.Assert.areEqual(Constants.detachedModeMinWidth, parseInt(getComputedStyle(this._element).width, 10), "Invalid min width of toolbar in detached mode");
        }

        testAttachedModeMinWidth() {
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeContent, label: "1", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeContent, label: "2", section: Constants.secondaryCommandSection }),
            ]);
            this._element.style.width = "10px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeAttached,
                data: data
            });

            LiveUnit.Assert.areEqual(320, parseInt(getComputedStyle(this._element).width, 10), "Invalid min width of toolbar in attached mode");
        }

        testAttachedOverflowAreaContainerHeightWhenThereIsNoOverflow() {
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeContent, label: "1" }),
                new Command(null, { type: Constants.typeContent, label: "2" }),
            ]);

            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeAttached,
                data: data
            });

            LiveUnit.Assert.areEqual(0, WinJS.Utilities.getTotalHeight(toolbar._attachedOverflowArea), "Invalid height for the overflow area container when there are no commands that overflow");
        }

        testAttachedOverflowAreaContainerSize() {
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "1" }),
                new Command(null, { type: Constants.typeButton, label: "2" }),
                new Command(null, { type: Constants.typeButton, label: "3" }),
                new Command(null, { type: Constants.typeButton, label: "4" }),
                new Command(null, { type: Constants.typeButton, label: "1", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "this is a really long label this is a really long label this is a really long label this is a really long label this is a really long label this is a really long label this is a really long label this is a really long label this is a really long label this is a really long label this is a really long label this is a really long label this is a really long label this is a really long label this is a really long label this is a really long label ", section: Constants.secondaryCommandSection }),
            ]);
            this._element.style.width = "10px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeAttached,
                data: data
            });

            // Make sure all primary commands fit
            var width = (4 * toolbar._standardCommandWidth + toolbar._overflowButtonWidth);
            this._element.style.width = width + "px";
            toolbar.forceLayout();

            LiveUnit.Assert.areEqual(2, getVisibleCommandsInElement(toolbar._attachedOverflowArea).length, "There should only be 2 commands in the overflow area");
            LiveUnit.Assert.areEqual(2 * Constants.overflowAttachedCommandHeight, WinJS.Utilities.getTotalHeight(toolbar._attachedOverflowArea), "Invalid height for the overflow area container");
            LiveUnit.Assert.areEqual(width, WinJS.Utilities.getTotalWidth(toolbar._attachedOverflowArea), "Invalid width for the overflow area container");
            LiveUnit.Assert.areEqual(toolbar.element, toolbar._attachedOverflowArea.parentNode, "Invalid parent for the overflow area container");
            LiveUnit.Assert.areEqual(toolbar.element, toolbar._mainActionArea.parentNode, "Invalid parent for the main action area container");
        }

        testAttachedOverflowMaxHeightForOnlySecondaryCommands() {
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "1", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "2", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "3", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "4", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "5", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "6", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "7", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "8", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "9", section: Constants.secondaryCommandSection }),
            ]);
            this._element.style.width = "1000px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeAttached,
                data: data
            });

            LiveUnit.Assert.areEqual(4.5 * Constants.overflowAttachedCommandHeight, WinJS.Utilities.getTotalHeight(toolbar._attachedOverflowArea), "Invalid height for the overflow area container");
            LiveUnit.Assert.areEqual(9, getVisibleCommandsInElement(toolbar._attachedOverflowArea).length, "There should be 9 commands in the overflow area");
        }

        testAttachedOverflowMaxHeightForMixedCommands() {
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "1" }),
                new Command(null, { type: Constants.typeButton, label: "2" }),
                new Command(null, { type: Constants.typeButton, label: "3" }),
                new Command(null, { type: Constants.typeButton, label: "4" }),
                new Command(null, { type: Constants.typeButton, label: "5" }),
                new Command(null, { type: Constants.typeButton, label: "6" }),
                new Command(null, { type: Constants.typeButton, label: "7" }),
                new Command(null, { type: Constants.typeButton, label: "8" }),
                new Command(null, { type: Constants.typeButton, label: "s1", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "s2", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "s3", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "s4", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "s5", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "s6", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "s7", section: Constants.secondaryCommandSection }),
            ]);
            this._element.style.width = "320px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeAttached,
                data: data
            });

            LiveUnit.Assert.areEqual(Constants.overflowAttachedSeparatorHeight + (4.5 * Constants.overflowAttachedCommandHeight), WinJS.Utilities.getTotalHeight(toolbar._attachedOverflowArea), "Invalid height for the overflow area container");
        }

        testAttachedModeOverflowButtonVisiblity() {
            var data = new WinJS.Binding.List([
                new Command(null, { type: Constants.typeButton, label: "s1", section: Constants.secondaryCommandSection }),
            ]);
            this._element.style.width = "320px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeAttached,
                data: data
            });
            LiveUnit.Assert.areEqual("hidden", getComputedStyle(toolbar._overflowButton).visibility, "Overflow button should not be visible in attached mode");
            LiveUnit.Assert.areNotEqual("none", getComputedStyle(toolbar._overflowButton).display, "Overflow button should still take space in attached mode");
            LiveUnit.Assert.areEqual(24, WinJS.Utilities.getTotalHeight(toolbar._overflowButton), "Overflow button has an invalid height");
        }

        testKeyboardingAttached(complete) {
            var Key = WinJS.Utilities.Key;
            var firstEL = document.createElement("button");
            var data = new WinJS.Binding.List([
                new Command(firstEL, { type: Constants.typeButton, label: "1" }),
                new Command(null, { type: Constants.typeButton, label: "2" }),
                new Command(null, { type: Constants.typeButton, label: "3", hidden: true }),
                new Command(null, { type: Constants.typeButton, label: "4" }),
                new Command(null, { type: Constants.typeButton, label: "s1", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "s2", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "s3", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "s4", section: Constants.secondaryCommandSection }),
            ]);
            this._element.style.width = "320px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeAttached,
                data: data
            });

            toolbar.element.focus();
            setTimeout(function () {
                Helper.keydown(toolbar.element, Key.rightArrow);
                LiveUnit.Assert.areEqual(firstEL, document.activeElement);
                LiveUnit.Assert.areEqual("1", document.activeElement.textContent);

                Helper.keydown(toolbar.element, Key.end);
                LiveUnit.Assert.areEqual("s4", document.activeElement.textContent);

                Helper.keydown(toolbar.element, Key.home);
                LiveUnit.Assert.areEqual("1", document.activeElement.textContent);

                Helper.keydown(toolbar.element, Key.rightArrow);
                LiveUnit.Assert.areEqual("2", document.activeElement.textContent);

                Helper.keydown(toolbar.element, Key.downArrow);
                LiveUnit.Assert.areEqual("4", document.activeElement.textContent, "Down arrow should skip '3' because that command is hidden");

                Helper.keydown(toolbar.element, Key.rightArrow);
                LiveUnit.Assert.areEqual("s1", document.activeElement.textContent);

                Helper.keydown(toolbar.element, Key.downArrow);
                LiveUnit.Assert.areEqual("s2", document.activeElement.textContent);

                Helper.keydown(toolbar.element, Key.leftArrow);
                LiveUnit.Assert.areEqual("s1", document.activeElement.textContent);

                Helper.keydown(toolbar.element, Key.upArrow);
                LiveUnit.Assert.areEqual("4", document.activeElement.textContent);

                Helper.keydown(toolbar.element, Key.upArrow);
                LiveUnit.Assert.areEqual("2", document.activeElement.textContent, "Up arrow should skip '3' because that command is hidden");
                complete();
            });
        }

        testKeyboardingDetached(complete) {
            var Key = WinJS.Utilities.Key;
            var firstEL = document.createElement("button");
            var data = new WinJS.Binding.List([
                new Command(firstEL, { type: Constants.typeButton, label: "1" }),
                new Command(null, { type: Constants.typeButton, label: "2", disabled: true }),
                new Command(null, { type: Constants.typeButton, label: "3" }),
                new Command(null, { type: Constants.typeButton, label: "4" }),
                new Command(null, { type: Constants.typeButton, label: "s1", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "s2", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "s3", section: Constants.secondaryCommandSection }),
                new Command(null, { type: Constants.typeButton, label: "s4", section: Constants.secondaryCommandSection }),
            ]);
            this._element.style.width = "10px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            this._element.style.width = (3 * toolbar._standardCommandWidth) + toolbar._overflowButtonWidth + "px";
            toolbar.forceLayout();

            // The main action area should only show | 1 | 2 (disabled) | 3  | ... |
            toolbar.element.focus();
            setTimeout(function () {
                Helper.keydown(toolbar.element, Key.downArrow);
                LiveUnit.Assert.areEqual(firstEL, document.activeElement);
                LiveUnit.Assert.areEqual("1", document.activeElement.textContent);

                Helper.keydown(toolbar.element, Key.end);
                LiveUnit.Assert.areEqual("3", document.activeElement.textContent);

                Helper.keydown(toolbar.element, Key.rightArrow);
                LiveUnit.Assert.areEqual(toolbar._overflowButton, document.activeElement);

                Helper.keydown(toolbar.element, Key.home);
                LiveUnit.Assert.areEqual("1", document.activeElement.textContent);

                Helper.keydown(toolbar.element, Key.rightArrow);
                LiveUnit.Assert.areEqual("3", document.activeElement.textContent, "Right arrow, should skip '2' because that command is disabled");

                Helper.keydown(toolbar.element, Key.downArrow);
                LiveUnit.Assert.areEqual(toolbar._overflowButton, document.activeElement);

                Helper.keydown(toolbar.element, Key.rightArrow);
                LiveUnit.Assert.areEqual(toolbar._overflowButton, document.activeElement);

                Helper.keydown(toolbar.element, Key.leftArrow);
                LiveUnit.Assert.areEqual("3", document.activeElement.textContent);

                Helper.keydown(toolbar.element, Key.upArrow);
                LiveUnit.Assert.areEqual("1", document.activeElement.textContent, "Up arrow, should skip '2' because that command is disabled");
                complete();
            });
        }

        testKeyboardingWithCustomContent(complete) {
            var Key = WinJS.Utilities.Key;
            var firstEL = document.createElement("button");
            var customEl = document.createElement("div");
            var firstCheckBox = document.createElement("input");
            firstCheckBox.type = "checkbox";
            var secondCheckBox = document.createElement("input");
            secondCheckBox.type = "checkbox";
            customEl.appendChild(firstCheckBox);
            customEl.appendChild(secondCheckBox);
            var lastEl = document.createElement("button");
            var data = new WinJS.Binding.List([
                new Command(firstEL, { type: Constants.typeButton, label: "1" }),
                new Command(customEl, { type: Constants.typeContent, label: "2", firstElementFocus: firstCheckBox, lastElementFocus: secondCheckBox }),
                new Command(lastEl, { type: Constants.typeButton, label: "3" }),
            ]);
            this._element.style.width = "10px";
            var toolbar = new Toolbar(this._element, {
                overflowMode: Constants.overflowModeDetached,
                data: data
            });

            var customContentWidth = toolbar._getCommandWidth(data.getAt(1));
            this._element.style.width = (2 * toolbar._standardCommandWidth) + customContentWidth + "px";
            toolbar.forceLayout();

            // The main action area should show | 1 | 2 (custom) | 3 |

            toolbar.element.focus();
            setTimeout(function () {
                Helper.keydown(toolbar.element, Key.rightArrow);
                LiveUnit.Assert.areEqual(firstEL, document.activeElement);

                Helper.keydown(toolbar.element, Key.end);
                LiveUnit.Assert.areEqual(lastEl, document.activeElement);

                Helper.keydown(toolbar.element, Key.leftArrow);
                LiveUnit.Assert.areEqual(secondCheckBox, document.activeElement);

                Helper.keydown(toolbar.element, Key.leftArrow);
                LiveUnit.Assert.areEqual(firstEL, document.activeElement);

                Helper.keydown(toolbar.element, Key.rightArrow);
                LiveUnit.Assert.areEqual(firstCheckBox, document.activeElement);

                Helper.keydown(toolbar.element, Key.home);
                LiveUnit.Assert.areEqual(firstEL, document.activeElement);
                complete();
            });
        }
    }
}
LiveUnit.registerTestClass("CorsicaTests.ToolbarTests");