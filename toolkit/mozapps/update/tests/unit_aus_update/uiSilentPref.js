/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */

/**
 * Test that nsIUpdatePrompt doesn't display UI for showUpdateInstalled,
 * showUpdateAvailable, and showUpdateError when the app.update.silent
 * preference is true.
 */

function run_test() {
  setupTestCommon();

  debugDump("testing nsIUpdatePrompt notifications should not be seen " +
            "when the " + PREF_APP_UPDATE_SILENT + " preference is true");

  Services.prefs.setBoolPref(PREF_APP_UPDATE_SILENT, true);

  let registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
  registrar.registerFactory(Components.ID("{1dfeb90a-2193-45d5-9cb8-864928b2af55}"),
                            "Fake Window Watcher",
                            "@mozilla.org/embedcomp/window-watcher;1",
                            WindowWatcherFactory);

  standardInit();

  debugDump("testing showUpdateInstalled should not call openWindow");
  Services.prefs.setBoolPref(PREF_APP_UPDATE_SHOW_INSTALLED_UI, true);

  gCheckFunc = check_showUpdateInstalled;
  gUP.showUpdateInstalled();
  // Report a successful check after the call to showUpdateInstalled since it
  // didn't throw and otherwise it would report no tests run.
  do_check_true(true);

  debugDump("testing showUpdateAvailable should not call openWindow");
  writeUpdatesToXMLFile(getLocalUpdatesXMLString(""), false);
  let patches = getLocalPatchString(null, null, null, null, null, null,
                                    STATE_FAILED);
  let updates = getLocalUpdateString(patches);
  writeUpdatesToXMLFile(getLocalUpdatesXMLString(updates), true);
  writeStatusFile(STATE_FAILED);
  reloadUpdateManagerData();

  gCheckFunc = check_showUpdateAvailable;
  let update = gUpdateManager.activeUpdate;
  gUP.showUpdateAvailable(update);
  // Report a successful check after the call to showUpdateAvailable since it
  // didn't throw and otherwise it would report no tests run.
  do_check_true(true);

  debugDump("testing showUpdateError should not call getNewPrompter");
  gCheckFunc = check_showUpdateError;
  update.errorCode = WRITE_ERROR;
  gUP.showUpdateError(update);
  // Report a successful check after the call to showUpdateError since it
  // didn't throw and otherwise it would report no tests run.
  do_check_true(true);

  registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
  registrar.unregisterFactory(Components.ID("{1dfeb90a-2193-45d5-9cb8-864928b2af55}"),
                              WindowWatcherFactory);

  doTestFinish();
}

function check_showUpdateInstalled() {
  do_throw("showUpdateInstalled should not have called openWindow!");
}

function check_showUpdateAvailable() {
  do_throw("showUpdateAvailable should not have called openWindow!");
}

function check_showUpdateError() {
  do_throw("showUpdateError should not have seen getNewPrompter!");
}

const WindowWatcher = {
  openWindow: function(aParent, aUrl, aName, aFeatures, aArgs) {
    gCheckFunc();
  },

  getNewPrompter: function(aParent) {
    gCheckFunc();
  },

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIWindowWatcher])
};

const WindowWatcherFactory = {
  createInstance: function createInstance(aOuter, aIID) {
    if (aOuter != null) {
      throw Cr.NS_ERROR_NO_AGGREGATION;
    }
    return WindowWatcher.QueryInterface(aIID);
  }
};
