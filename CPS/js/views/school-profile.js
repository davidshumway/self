/**
 * @authors DS, JA, VS
 * @brief A profile singleton for schools.
 * 
 * @reference
 *  For chart, following tutorial is referenced:
 * 	http://www.darreningram.net/creating-a-simple-bar-chart-with-d3-js/
 * 
 * @usage
 *  Include school-profile.js at the end of HTML document after D3 has
 *	been included, as well as a #profile div.
 *  Call schoolProfile.load( [ID1, ID2, ...], year ) to load one 
 *  or more schools.
 * 
 * @example-usage
 *  schoolProfile.load( [4000153], 2019 )
 * 
 * @requirements
 *  Must be loaded after D3. There must be a #profile element.
 */

// There is only one schoolProfile (singleton).
var schoolProfile = {};

/**
 * Use to check if page contains sufficient requirements to generate profile.
 *
 * @example-usage
 *	if (schoolProfile.require()) { schoolProfile.load([400099]) }
 */
schoolProfile.require = function() {
  var d3 = d3_version1;
  
  try {
    // Must have d3, must have id=profile element.
    d3.select('#profile-charts');
  } catch (e) {
    console.log('WARN: Missing #profile div for profile!');
    return false;
  }
  
  // Reset
  schoolProfile.reset();
  
  // Add default text
  var d = d3.select('#profile-charts').append('div');
  d.node().id = 'profile-preload';
  d.node().className = 'unselectable-text';
  d.node().style.display = 'none'; // Hide it
  d.text('Select a school to view its profile.');
  
  // Stretch the intro text to fit container size.
  // Needs to be on a timeout as the page itself is loading
  // and resizing.
  setTimeout(schoolProfile.stretch, 600);
  setTimeout(function () { // Now show it
    d3.select('#profile-preload').node().style.display = 'flex';
  }, 600);
  
  // Add button behavior
  d3.select('#profile-search-button').on('click', function() {
    schoolProfile.lightbox((schoolProfile.schoolCompareLightbox).bind(this));
  });
  return true;
}

/**
 * DEBUG
 * Deprecated
 */
//~ schoolProfile.debug = function() {
  //~ if (window.location.href.indexOf('debug') != -1) {
    //~ this.load(/debug(\d+)/.exec(window.location.href)[1]);
    //~ // School ID follows "debug".
  //~ }
//~ }
//~ schoolProfile.debug();

/**
 * @brief Stretch the profile when the page reloads.
 */
schoolProfile.stretch = function() {
  var bb = d3.select('#profile').node().getBoundingClientRect();
  try {
    var x = d3.select('#profile-preload').node();
    if (x != null)
      x.style.height = (bb.height - 42) + 'px';
  } catch(e) {
    //
    console.log('caught e',e);
  }
}
  
/**
 * @brief Clear map markers
 */
schoolProfile.clearPreviousMarkers = function() {
  if (!mapOpts.currentHighlightedMarkers) {
    return;
  }
  for (var i in mapOpts.currentHighlightedMarkers) {
    try {
      var marker = mapOpts.currentHighlightedMarkers[i];
      //~ console.log('Reset marker',marker);
      marker.options.weight = 0.5;
      marker._radius = 8;
      marker.options.color = '#000';
      marker.options.dashArray = '';
      marker.setStyle(); // refreshes
    } catch(e) {
      console.log('Caught error in clearPreviousMarkers', e);
    }
  }
  mapOpts.currentHighlightedMarkers = [];
}
/**
 * @brief Highlight selected markers
 */
schoolProfile.highlightMarkers = function(schoolArray) {
  // Start by resetting currentHighlightedMarker
  mapOpts.currentHighlightedMarkers = [];
  
  for (var i in schoolArray) {
    var id = schoolArray[i];
    
    // Open on map
    try {
      var md = model.data.byId[id];
      $("#school-zip").val(md.Zip);
      mapOpts.fireZipClick();
    } catch(e) {
      // School does not exist?
    }
    
    // Set marker style
    try {
      var m = mapOpts.markersBySchoolID[id];
      mapOpts.currentHighlightedMarkers.push(mapOpts.markersBySchoolID[id]);
      //~ if (m.options.shape == 'triangle') {
      //~ } else {
      //~ }
      m.options.color = '#111';
      m.options.dashArray = '';
      m.options.weight = 4;
      //~ mapOpts.currentHighlightedMarker._radius = 20;
      m.setStyle(); // refreshes
    } catch(e) {
      //
    }
  }
}

/**
 * @brief Load data and select school by school ID.
 * 
 * @extended Assumption is that model has been loaded.
 *      If there are multiple schools passed in, then the idea
 *      is that they are being compared.
 * 
 * @param schoolArray IDs (ints or strings) of schools to load.
 * @param year Int or str of year to load.
 */
schoolProfile.load = function(schoolArray, year, blockScroll) {
  var d3 = d3_version1;
  
  // Reset profile
  var d = d3.select('#profile-charts');
  d.selectAll('*').remove();
  
  // If empty school array, show loading
  if (!schoolArray.length) {
    // Hide section content
    d3.select('#profile-content').style('display', 'none');
    d3.select('#profile-content-multi').style('display', 'none');
    d3.select('#profile-content-single').style('display', 'none');
    
    schoolProfile.require();
    return;
  } else {
    // Show section content
    d3.select('#profile-content').style('display', '');
  }
  
  // Pan to view and marker highlights
  // Clear previous markers
  schoolProfile.clearPreviousMarkers();
  
  // Highlight
  schoolProfile.highlightMarkers(schoolArray);
  
  // Set globals
  schoolProfile.reset();
  schoolProfile.currentView.currentSchoolArray = schoolArray;
  schoolProfile.currentView.currentSchoolYear = year;
  schoolProfile.saToObj(schoolArray); // sets schoolProfile.currentView.currentSchoolArrayObj
  schoolProfile.currentView.schoolComparison =
    (schoolArray.length > 1)
    ? true : false;
    
  // Init
  schoolProfile.init(schoolArray, year);
}

/**
 * @brief School array to school array object (for fast lookup)
 */
schoolProfile.saToObj = function(schoolArray) {
  for (var i in schoolArray) {
    var id = schoolArray[i];
    schoolProfile.currentView.currentSchoolArrayObj[id] = true;
  }
}

/**
 * @brief Add to compare.
 * 
 * @param schoolID Integer (or str?) representing a school's ID
 */
schoolProfile.addToCompare = function(schoolID) {
  var d3 = d3_version1;
  if (!schoolProfile.currentView) {
    schoolProfile.reset();
  }
  var x = schoolProfile.currentView.currentSchoolArray;
  var y = schoolProfile.currentView.currentSchoolYear;
  if (!schoolProfile.currentView.currentSchoolArrayObj[schoolID]) {
    x.push(schoolID);
  }
  schoolProfile.reset();
  schoolProfile.load(x, y, true);
  
  //~ var x;
  //~ var d = d3.select('#schoolCompareButton').node();
  //~ if (d.style.opacity == 0
      //~ && schoolProfile.currentView
      //~ && schoolProfile.currentView.currentSchoolArray) {
    //~ // If opacity = 0 it's a new comparison
    //~ schoolProfile.currentView.currentSchoolArray = [schoolID];
    //~ schoolProfile.currentView.currentSchoolArrayObj[schoolID] = true;
  //~ }
  //~ if (schoolProfile.currentView
      //~ && schoolProfile.currentView.currentSchoolArray) {
    //~ x = schoolProfile.currentView.currentSchoolArray;
    //~ if (!schoolProfile.currentView.currentSchoolArrayObj[schoolID]) {
      //~ x.push(schoolID);
    //~ }
  //~ } else {
    //~ x = [ schoolID ];
  //~ }
  //~ var n = (x.length == 1) ? ' school' : ' schools';
  //~ d.style.opacity = 1;
  //~ d.value = 'Comparing '
    //~ + x.length + n + '\n (Click to view comparison)';
  //~ d.onclick = function() {
    //~ d.style.opacity = 0;
  //~ }
  //~ schoolProfile.reset();
  // true to block scroll
  //schoolProfile.load(x, schoolProfile.currentView.currentSchoolYear, true);
}
/**
 * @brief Reset.
 */
schoolProfile.reset = function() {
  schoolProfile.currentView = {
    schoolComparison: false, // set to true if multi-compare, used in onclick line chart
    currentSchoolArray: [], // tracks current school's being shown
    currentSchoolArrayObj: {}, // fast dictionary lookup
    currentSchoolYear: 2019, // fast dictionary lookup
    currentTrend: false, // None or 1-4
  }
  
  schoolProfile.html = { // list of elements that will be populated
    filters: { // html elements for filtering
      lineCompare: [],
      barChart: [],
    },
  }
  schoolProfile.s = {
    dems: ['AA', 'AP', 'AS', 'HI', 'HP', 'MR', 'NA','NM','WH'],
    demsFull: ['African American', 'Asian/Pacific Islander (Retired)',
    'Asian', 'Hispanic', 'Hawaiian/Pacific Islander', 'Multi-Racial',
    'Not Available','Native American/Alaskan','White'],
  }
  schoolProfile.model = { // hold a model of schoolProfile
    schoolComparison: {
      searchResults: [],
      searchResultsObj: {},
    }
  }
  
  // Reset trends key
  var n = document.getElementsByClassName('profile-trends-key');
  for (var i=0; i<n.length; i++) {
    n[i].style.border = '';
    n[i].title = 'Click to filter';
  }
}

/**
 * @brief Redraw without changing current settings.
 */
schoolProfile.redraw = function() {
  d3.select('#profile-charts').selectAll('*').remove();
  // Which?
  var n = d3.select('#profile-select-chart0').node().checked;
  if (n) {
    schoolProfile.stackedBar(
      schoolProfile.currentView.currentSchoolArray,
      schoolProfile.currentView.currentTrend
    );
  } else {
    schoolProfile.drawLine( // Line chart
      schoolProfile.currentView.currentSchoolArray,
      schoolProfile.currentView.currentTrend,
    );
  }
}

/**
 * @brief Make the profile.
 */
schoolProfile.init = function(schoolArray, year) {
  var d3 = d3_version1;
  
  // Some intitial output
  var d = d3.select('#profile-charts');
  
  schoolProfile.html.title = d3.select('#profile-title');
  schoolProfile.html.lineContainer = d3.select('#profile-charts');
  schoolProfile.html.lineContainer.className = 'profile-container';
  schoolProfile.lineCompare(schoolArray, [], year); // [] => all dems
  
  // Which?
  var n = d3.select('#profile-select-chart0').node().checked;
  if (n) { // Draw stacked bar
    schoolProfile.stackedBar(
      schoolArray, schoolProfile.currentView.currentTrend);
  } else { // Draw line chart
    schoolProfile.drawLine(
      schoolArray, schoolProfile.currentView.currentTrend);
  }
}

/**
 * @brief A dialog to add / remove schools to compare.
 * 
 * @extended
 *    Left side: Add to compare
 *    Right side: Remove from compare
 * 
 * @param divLboxContainer HTMLObject that is the lightbox container.
 */
schoolProfile.schoolCompareLightbox = function(divLboxContainer) {
  var d3 = d3_version1;
  
  var c = divLboxContainer.container;
  var lb = { // Will hold all lightbox html elements
    container: divLboxContainer, // reference to main container
    // left
    text: null,
    filterAll: null,
    filterHS: null,
    searchResults: null,
    addResults: null,
    // right
    selectedResults: null,
    clearSelected: null,
  };
  schoolProfile.html.lightbox = lb;
  
  // Reset if existing
  c.node().innerText = '';

  // Title
  c.append('h4').text('School Select');
  
  // Top border
  c.append('hr').node().setAttribute('style',
    'width: 100%; border: 0px; border-top: 8px groove #ddd; margin-top: 2px; margin-bottom: 2px;'
  );
  
  var d1, d2;
  d1 = c.append('div');
  d2 = c.append('div');
  d1.node().className = 'profile-lightbox-compare-container';
  d2.node().className = 'profile-lightbox-compare-container';
  //~ d1.node().style.borderRight = '1px solid #ccc';
  
  // left
  // Text input
  var inp = d1.append('input');
  inp.node().placeholder = 'Enter a school to filter by school name';
  inp.node().id = 'profile-lightbox-compare-search';
  inp.node().addEventListener('keyup', function(e) {
    schoolProfile.schoolCompareLightbox_searchResultSchools();
  });
  inp.node().focus(); // Set focus
  lb.text = inp;
  
  // Add radio to display HS only
  // opts 3: include all schools or only HS
  var fs = d1.append('fieldset');
  fs.node().className = 'filters';
  var lg = fs.append('legend').node();
  lg.innerText = 'All or HS';
  var inp = fs.append('input');
  inp.node().id = 'inp-allorhs-all';
  inp.node().type = 'radio';
  inp.node().name = 'inp-allorhs';
  lb.filterAll = inp;
  inp.on('change', schoolProfile.schoolCompareLightbox_searchResultSchools);
  var lab = fs.append('label').node();
  lab.htmlFor = inp.node().id;
  lab.innerText = 'All schools';
  inp.checked = false;
  lab.className = 'hasPointer paddedInputs';
  inp.className = 'hasPointer paddedInputs';
  var inp = fs.append('input');
  inp.node().id = 'inp-allorhs-hs';
  inp.node().type = 'radio';
  inp.node().checked = true;
  inp.node().name = 'inp-allorhs';
  lb.filterHS = inp;
  inp.on('change', schoolProfile.schoolCompareLightbox_searchResultSchools);
  var lab = fs.append('label').node();
  lab.htmlFor = inp.node().id;
  lab.innerText = 'HS only';
  lab.className = 'hasPointer paddedInputs';
  inp.className = 'hasPointer paddedInputs';
  // Result div
  var d = d1.append('div');
  d.node().className = 'profile-lightbox-compare-results';
  lb.searchResults = d;
  // Schools to div
  schoolProfile.schoolCompareLightbox_searchResultSchools();
  // Add all schools shown
  var inp = d1.append('input');
  inp.node().type = 'button';
  inp.node().value = 'Add all schools shown';
  inp.node().setAttribute('style', 'margin-left:35%;width:30%;margin-top:4px;');
  lb.addResults = inp;
  inp.on('click', function() {
    var sr = schoolProfile.model.schoolComparison.searchResults;
    var sa = schoolProfile.currentView.currentSchoolArray;
    var sao = schoolProfile.currentView.currentSchoolArrayObj;
    for (var i in sr) {
      var id = sr[i]['School ID'];
      if (!sao[id]) {
        sa.push(id);
        sao[id] = true;
      }
    }
    // Redraw
    schoolProfile.schoolCompareLightbox_searchResultSchools();
    schoolProfile.schoolCompareLightbox_rightPaneResults();
  });
  
  /**
   * Right side
   */
   
  // Append a fieldset that is invisible to adjust the height of
  // right side to match left side.
  var fs = d2.append('fieldset');
  fs.node().className = 'filters';
  fs.node().style.opacity = '0';
  fs.html('<input type="radio"/><label><b>&nbsp;</b></label>');
  var lg = fs.append('legend').node();
  lg.innerHTML = '&nbsp;';
  
  var x = d2.append('div');
  x.text('Click on a school below to remove from comparison');
  x.node().style.marginLeft = '2%';
  x.node().style.display = 'inline';
  x.node().style.verticalAlign = 'bottom';
  // Present selection
  var d = d2.append('div');
  d.node().className = 'profile-lightbox-compare-results';
  lb.selectedResults = d;
  // Clear all
  var inp = d2.append('input');
  inp.node().type = 'button';
  inp.node().value = 'Remove all selected schools';
  inp.node().setAttribute('style',
    'margin-left:35%;width:30%;margin-top:4px;'
  );
  lb.clearSelected = inp;
  inp.on('click', function() {
    schoolProfile.model.schoolComparison.searchResults = [];
    schoolProfile.model.schoolComparison.searchResultsObj = {};
    schoolProfile.currentView.currentSchoolArray = [];
    schoolProfile.currentView.currentSchoolArrayObj = {};
    schoolProfile.currentView.schoolComparison = false; // Basic re-init of profile
    // Redraw
    schoolProfile.schoolCompareLightbox_searchResultSchools();
    schoolProfile.schoolCompareLightbox_rightPaneResults();
  });
  
  // Fill right pane (initial)
  schoolProfile.schoolCompareLightbox_rightPaneResults();
  
  // Bottom hr
  //~ c.append('hr').node().setAttribute('style', 'width:100%;border-color:#ccc;display:inline-block;');
  
  // Compare button
  c.append('br');
  c.append('br');
  var inp = c.append('input');
  inp.node().setAttribute('style',
    'width: 40%; margin-left: 30%; font-size: 1.4em; font-weight: bold; margin-top: 10px;'
  );
  inp.node().type = 'button';
  inp.node().value = 'Compare selected schools';
  inp.on('click', function() {
    this.disabled = true;
    this.value = ' ... loading comparison ... ';
    setTimeout(function() { // Timeout forces redraw of this value
      d3.select('#profile-lightbox').node().click();
      schoolProfile.load(schoolProfile.currentView.currentSchoolArray, 2019);
    }, 40);
  });
}

/**
 * @brief Build right pane lightbox, selected results field.
 * 
 * @extended
 *    - Utilizes and builds off of
 *      schoolProfile.currentView.currentSchoolArray.
 */
schoolProfile.schoolCompareLightbox_rightPaneResults = function() {
  var d3 = d3_version1;
  
  // get vars
  // For text, only word chars are needed. No digits, spaces, etc.
  var lb = schoolProfile.html.lightbox;
  var selectedResults = lb.selectedResults;
  selectedResults.node().innerText = ''; // clear any previous results
  
  for (var i in schoolProfile.currentView.currentSchoolArray) {
    var id = schoolProfile.currentView.currentSchoolArray[i];
    // May be missing some, so add to try.
    // i.e., current schools array may contain IDs from any number
    // of years.
    try {
      var s = model.data.allSchools[2019][id]; // get school
      if (s['School Name'] == '' || s['School Name'].indexOf('District') != -1)
        continue;
      selectedResults.node().appendChild(
        schoolProfile.schoolCompareLightbox_addRow('right', s)
      );
    } catch(e) {
      console.log('WARN: Could not find school with id ', id);
    }
  }
}
/**
 * @brief Build left pane lightbox search results field.
 * 
 * @extended
 *    - For text, only word chararacters are needed.
 *      No digits, spaces, etc.
 *    - Only uses 2019 schools. Does not add any schools previous
 *      or closed.
 */
schoolProfile.schoolCompareLightbox_searchResultSchools = function() {
  var d3 = d3_version1;
  
  // get vars
  // For text, only word chars are needed. No digits, spaces, etc.
  var lb = schoolProfile.html.lightbox;
  var text = lb.text.node().value.toUpperCase().replace(/[^\w]/g, '');
  var allOrHs = (lb.filterAll.node().checked) ? 'allSchools' : 'highSchools';
  var searchResults = lb.searchResults;
  searchResults.node().innerText = ''; // clear any previous results
  // Reset global vars
  schoolProfile.model.schoolComparison.searchResults = [];
  schoolProfile.model.schoolComparison.searchResultsObj = {};
  
  for (var id in model.data[allOrHs][2019]) {
    var s = model.data[allOrHs][2019][id]; // get school
    // Invalid schools
    if (!s || !s['School Name'] || s['School Name'] == '' || s['School Name'].indexOf('District') != -1)
      continue;
    if (schoolProfile.currentView.currentSchoolArrayObj[id]) {
      // already selected
      // but show filtered only
      if (s['SchoolNameForSearches'].indexOf(text) != -1) {
        var d = searchResults.append('div');
        d.text(
          s['School Name'] + ' (already selected)'
        );
        d.node().className = 'profile-lightbox-compare-searchResultDiv';
      }
      continue;
    }
    if (text != '') {
      // show filtered only
      if (s['SchoolNameForSearches'].indexOf(text) != -1) {
        searchResults.node().appendChild(
          schoolProfile.schoolCompareLightbox_addRow('left', s)
        );
        schoolProfile.model.schoolComparison.searchResults.push(s);
        schoolProfile.model.schoolComparison.searchResultsObj[s['School ID']] = s;
      }
    } else {
      // show all
      searchResults.node().appendChild(
        schoolProfile.schoolCompareLightbox_addRow('left', s)
      );
      schoolProfile.model.schoolComparison.searchResults.push(s);
      schoolProfile.model.schoolComparison.searchResultsObj[s['School ID']] = s;
    }
  }
}
/**
 * 
 * @param leftOrRight String to denote if adding to left or right pane.
 * @param schoolObj Object representing row of school data from model.
 * 
 * @usageExample
 *     schoolProfile.schoolCompareLightbox_addRow('left');
 */
schoolProfile.schoolCompareLightbox_addRow = function(leftOrRight, schoolObj) {
  var d3 = d3_version1;
  
  var d = document.createElement('div');
  d.className = 'profile-lightbox-compare-searchResultDiv';
  d.innerText = schoolObj['School Name'];
  d.side = leftOrRight;
  d.so = schoolObj;
  d.addEventListener('click', function() {
    var id = this.so['School ID'];
    if (d.side == 'left') {
      // left side (add)
      schoolProfile.currentView.currentSchoolArray.push(id);
      schoolProfile.currentView.currentSchoolArrayObj[id] = true;
    } else {
      // right side (remove)
      var tmp = [];
      for (var i in schoolProfile.currentView.currentSchoolArray) {
        var idx = schoolProfile.currentView.currentSchoolArray[i];
        if (idx == id)
          continue;
        tmp.push(idx);
      }
      schoolProfile.currentView.currentSchoolArray = tmp;
      delete schoolProfile.currentView.currentSchoolArrayObj[id];
    }
    // Redraw
    schoolProfile.schoolCompareLightbox_searchResultSchools();
    schoolProfile.schoolCompareLightbox_rightPaneResults();
  }, false);
  return d;
}

/**
 * @brief An HTML lightbox popup for sub-querying.
 * 
 * @param lfunc Function to run within the lightbox.
 * 
 * @callback Fires cb function with dark div container as parameter (.container).
 */
schoolProfile.lightbox = function(lfunc) {
  var d3 = d3_version1;
  // Dark div
  var b1 = d3.select('body').append('div');
  b1.node().id = 'profile-lightbox';
  // Container div
  var b2 = d3.select('body').append('div');
  b2.node().id = 'profile-lightbox-container';
  // x div
  var b3 = d3.select('body').append('div');
  b3.node().id = 'profile-lightbox-close-btn2';
  
  // Global accessors
  b1.container = b2;
  b1.node().xcont = b2.node();
  b1.node().xbtn = b3.node();
  
  
  // Onclick events
  b1.on("click", function() {
    document.body.removeChild(this.xcont);
    document.body.removeChild(this.xbtn);
    document.body.removeChild(this);
  });
  b3.on("click", function() {
    b1.node().click();
  });
  lfunc(b1);
}

/**
 * @brief Make line graph.
 * 
 * @implementation
 *    checkbox for dems
 *    mock-select field checkboxes for schools
 *    order select field for schools by distance to selected school
 * 
 * @param schoolArray Array of school IDs to load
 * @param demoArray Array of demographies to load
 *        (full, e.g. "Hispanic" not "HI")
 * @param year Number, the year value
 */
schoolProfile.lineCompare = function(schoolArray, demoArray, year) {
  var d3 = d3_version1;
  
  // Reset any previous
  schoolProfile.html.filters.lineCompare = [];
  schoolProfile.html.lineContainer.selectAll('*').remove();
  
  var ctitle = 'Population chart for ';
  try {
    if (schoolArray.length > 1)
      ctitle += 'selected schools';
    else {
      ctitle += model.data.allSchools[year][schoolArray[0]]['School Name'];
    }
  } catch(e) {
    //
  }
  schoolProfile.html.title = ctitle;
  
  var dems = ['AA', 'AP', 'AS', 'HI', 'HP', 'MR', 'NA','NM','WH'];
  var demsFull = ['African American', 'Asian/Pacific Islander(Retired)',
    'Asian', 'Hispanic', 'Hawaiian/Pacific Islander', 'Multi-Racial',
    'Not Available','Native American/Alaskan','White'];
  if (!demoArray || !demoArray.length) {
    demoArray = dems;
  }
  var schoolsObj = {}; // Quick lookup for selected schools
  var demsObj = {}; // Quick lookup for selected dems
  for (var i in demoArray) {
    demsObj[demoArray[i]] = true; // e.g., demsOjb['Hispanic'] = true;
  }
  for (var i in schoolArray) {
    schoolsObj[schoolArray[i]] = true; // e.g., demsOjb['Hispanic'] = true;
  }
  
  // opts 1
  // Select demos
  // Only in comparison
  if (schoolArray.length > 1) {
    var lcd = d3.select('#lc-select-dems');
    lcd.selectAll('*').remove();
    // Build fields
    for (var i in dems) {
      var inp = lcd.append('input').node();
      inp.id = 'inp-'+dems[i];
      inp.type = 'checkbox';
      inp.checked = true;
      var lab = lcd.append('label').node();
      lab.htmlFor = inp.id;
      lab.innerText = dems[i];
      inp.checked = demsObj.hasOwnProperty(dems[i]);
      lab.className = 'hasPointer paddedInputs';
      inp.className = 'hasPointer paddedInputs';
      inp.title = lab.title = demsFull[i];
      inp.schoolArray = schoolArray; // Temp. school array holder
      schoolProfile.html.filters.lineCompare.push(inp);
      inp.onclick = function() {
        //schoolProfile.drawLine(this.schoolArray);
        schoolProfile.redraw();
      }
    }
    lcd.append('br');
    var inp = lcd.append('input').node();
    inp.id = 'inp-dems-all';
    inp.type = 'button';
    inp.value = 'ALL';
    inp.style.marginRight = '2px';
    inp.schoolArray = schoolArray;
    inp.onclick = function() {
      for (var i in schoolProfile.html.filters.lineCompare) {
        var cb = schoolProfile.html.filters.lineCompare[i];
        cb.checked = true;
      }
      schoolProfile.redraw();
    }
    var inp = lcd.append('input').node();
    inp.id = 'inp-dems-none';
    inp.type = 'button';
    inp.value = 'NONE';
    inp.schoolArray = schoolArray;
    inp.onclick = function() {
      for (var i in schoolProfile.html.filters.lineCompare) {
        var cb = schoolProfile.html.filters.lineCompare[i];
        cb.checked = false;
      }
      schoolProfile.redraw();
    }
    // Filter if rising or falling
    
  } // End comparison
  
  // Add a spacer on multi
  if (schoolArray.length > 1) {
    // ...
  }
  
  // Click if multi
  if (schoolArray.length > 1) {
    var n = document.getElementsByClassName('profile-trends-key');
    for (var i=0; i<n.length; i++) {
      n[i].style.cursor = 'pointer';
      n[i].title = 'Click to filter';
      n[i].el = i + 1;
      n[i].onclick = function(e) {
        if (this.title == 'Click to reset') {
          this.title = '';
          this.style.border = '';
          schoolProfile.currentView.currentTrend = false;
          schoolProfile.redraw();
          return;
        }
        var n = document.getElementsByClassName('profile-trends-key');
        for (var i=0; i<n.length; i++) {
          n[i].style.border = '';
          n[i].title = 'Click to filter';
        }
        this.style.border = '2px dotted black';
        this.title = 'Click to reset';
        schoolProfile.currentView.currentTrend = this.el;
        schoolProfile.redraw();
      };
    }
  } else {
    var n = document.getElementsByClassName('profile-trends-key');
    for (var i=0; i<n.length; i++) {
      n[i].style.cursor = '';
      n[i].title = '';
    }
  }
  
  if (schoolArray.length == 1) {
    // Single school
    d3.select('#profile-content-single').style('display', '');
    d3.select('#profile-content-multi').style('display', 'none');
    var id = schoolArray[0];
    try {
      var m = model.data.allSchools[year][id];
      if (model.data.allSchools[year][id]['School Name']) {
        // Check if breaking try 
      }
    } catch(e) {
      console.log('WARN: (Profile) Could not find school with ID ' +
        id + ' in year ' + year);
      return;
    }
    //~ schoolProfile.html.title.text(m['School Name']); // Not here.
    var p = d3.select('#profile-single-info');
    p.text(
      m['School Name']// + ' | (ID: ' + m['School ID'] + ')'
    );
    // More details on single school
    if (model.data.byId[ m['School ID'] ]) {
      var n = model.data.byId[ m['School ID'] ];
      p.node().innerText += ' ';
      // Limit extraneous detail
      //~ p.node().innerText +=
        //~ '\n' + n['Address'] + ', ' + n['Zip']
        //~ + ', ' + n['Phone'] + ' ';
      // Append more details
      var inp = p.append('input').node();
      inp.type = 'button';
      inp.value = ' More details ';
      inp.title = 'More details about this school';
      inp.cpsData = model.data.byId[m['School ID']];
      inp.onclick = function() {
        schoolProfile.lightbox(function(divLboxContainer) {
          //console.log(this);
          // Bind to preserve reference to this (button)
          var c = divLboxContainer.container;
          var s = model.data.byId[
            schoolProfile.currentView.currentSchoolArray[0]
          ];
          c.append('h4').text('All CPS schema details for ' + s['School'] );
          c.append('h5').text('(Click background to close this dialog box.)');
          
          // Add some details.
          for (var i in s) {
            var d1 = c.append('span').text(i + ': ');
            var d2 = c.append('span').text(s[i]);
            d1.node().style.fontWeight = 'bold';
            c.append('br');
          }
        }.bind(this));
      }
    }
  } else {
    // Mutli-compare
    d3.select('#profile-content-multi').style('display', '');
    d3.select('#profile-content-single').style('display', 'none');
    d3.select('#profile-multi-num').text(schoolArray.length);
    
  }
  
  // opts 2: split or total the demographics
  // opts 3: include all schools or only HS
  
  // opts 4: selected schools
  // opts 4.1: add / remove schools to selected
  // opts 4.2: select "nearest 5/10/20" Hs/All for compare
  // opts 4.2: select "top 5/10/20" Hs/All in city for compare
  
  // opts 5: select type of trend line, e.g. interpolated
  // opts 6: opts for future trend line, e.g. ML, Lin. Regress.
  // opts 7: Population split by grade
  
  // opts 8: scoring data
  
  // Add bar chart here if multi.
  if (schoolArray.length > 1) {
    schoolProfile.html.barContainer = d3.select('#profile-multi-bar');
    schoolProfile.barDemographics(schoolArray, year);
  }
}

/**
 * @brief Return the sum of currently selected demos for given school.
 * 
 * @param schoolObj Object representing school in model.data.allSchools.
 */
schoolProfile.lineCompareSumDemos = function(schoolObj) {
  //schoolProfile.html.filters.lineCompare
  if (!schoolObj.demography) {
    return 0;
  }
  var sum = 0;
  for (var i in schoolProfile.html.filters.lineCompare) {
    // Get the input
    var inp = schoolProfile.html.filters.lineCompare[i];
    // Add to sum
    if (inp.checked) {
      var key = schoolProfile.s.demsFull[i] + 'No';
      sum += schoolObj.demography[key];
      if (!schoolObj.demography.hasOwnProperty(key)) {
        console.log('\n',schoolObj.demography);
        console.log(key, inp, schoolObj.demography[key]);
        console.log('missing dem key', key);
        alert('missing dem. key (school-profile.js)');
      }
    }
  }
  return sum;
}

/**
 * @brief Make line.
 * 
 * @extended
 *    If multiple schools, then draws only the total pop.
 *    in all schools, with option to show only selected demographies.
 *    If single school, then draws total pop. of school plus
 *    pop. of every demographic.
 *    Tri-color finder: http://colorschemedesigner.com/csd-3.5/
 */
schoolProfile.drawLine = function(schoolArray, filterTrend) {
  // use d3 "v1" in this function
  var d3 = d3_version1;
  
  // total pop.
  var lineGroups = [ // Array of line groups
    /*
    [ // ex. line group 1
      {
        'x': 1,
        'y': 5
      }, {
        'x': 20,
        'y': 20
      }
    ]
    , ...
    */
  ];
  
  var max = 0;
  if (schoolArray.length > 1) {
    // Multi-school
    for (var i in schoolArray) {
      var id = schoolArray[i];
      var nextLine = [];
      lineGroups.push(nextLine);
      for (var year in model.data.allSchools) {
        if (model.data.allSchools[year][id]
            && model.data.allSchools[year][id].total) {
          var t = schoolProfile.lineCompareSumDemos(
            model.data.allSchools[year][id]
          );
          nextLine.push({
            year: year,
            total: t,
            school: model.data.allSchools[year][id]['School Name'],
            id: id
          });
          max = (t > max) ? t : max;
        } else {
          // School must be closed ??
        }
      }
    }
  } else {
    // Single school
    var id = schoolArray[0];
    var byDemo = {
      total: [] // total pop.
      // ... all demos to follow
    };
    for (var year in model.data.allSchools) {
      if (model.data.allSchools[year][id]
          && model.data.allSchools[year][id].total) {
        // Update max
        var t = model.data.allSchools[year][id].total;
        max = (t > max) ? t : max;
        // Total
        byDemo['total'].push({
          year: year,
          // "Total" based on 20th day file total.
          total: model.data.allSchools[year][id].total,
          school: model.data.allSchools[year][id]['School Name']
        });
        if (model.data.allSchools[year][id].demography) {
          // Loop demos
          // School ID is null here b/c it is a single school view already,
          // so there is no need for school lookup.
          for (var demo in model.data.allSchools[year][id].demography) {
            var num = model.data.allSchools[year][id].demography[demo];
            if (/No$/.exec(demo)) {
              if (!byDemo.hasOwnProperty(demo)) {
                byDemo[demo] = [
                  {
                    year: year,
                    total: num,
                    school: demo.replace(/No$/, ''),
                    id: null,
                  }
                ];
              } else {
                byDemo[demo].push({
                  year: year,
                  total: num,
                  school: demo.replace(/No$/, ''),
                  id: null,
                });
              }
            }
          }
        }
      } else {
        // School must be closed ??
      }
    }
    for (var demo in byDemo) {
      lineGroups.push(byDemo[demo]);
    }
  }
  
  var lineData = lineGroups;
  
  // Reset container
  schoolProfile.html.lineContainer.selectAll('svg').remove('*');
  
  var vis = schoolProfile.html.lineContainer.append("svg");
  var xy1 = d3.select('#profile').node().getBoundingClientRect();
  var xy2 = d3.select('#profile-content').node().getBoundingClientRect();
  var WIDTH = xy1.width - 40;// initial is box... 700;
  var HEIGHT = xy1.height - xy2.height - 60;
  vis.attr('width', WIDTH);
  vis.attr('height', HEIGHT);
  
  var MARGINS = {
    top: 20,
    right: 100,
    bottom: 20,
    left: 100
  }
  
  vis.append("rect")
    .attr("width", WIDTH - MARGINS.left - MARGINS.right)
    .attr("height", HEIGHT)
    .attr("fill", "#ffffbf")
    .attr("x", MARGINS.left)
    .attr("y", - MARGINS.top);
  
  var xRange = d3.scale.linear()
    .range([MARGINS.left, WIDTH - MARGINS.right])
    .domain( [2014, 2019] );
  // Log would be 1) d3.scale.log() and 2) .domain([0.1, max])
  var yRange = d3.scale.linear()
    .range([HEIGHT - MARGINS.top, MARGINS.bottom])
    .domain([-20, max]);

  var xAxis = d3.svg
    .axis()
    .scale(xRange)
    .ticks(5)
    .orient("bottom")
    .tickFormat(function (d) {
      if (d == 2019) return "'19";
      else if (d == 2018) return "'18";
      else if (d == 2017) return "'17";
      else if (d == 2016) return "'16";
      else if (d == 2015) return "'15";
      else if (d == 2014) return "'14";
    })
    .innerTickSize(-HEIGHT)
    .outerTickSize(0);
  var yAxis = d3.svg.axis()
    .scale(yRange)
    .tickSize(5)
    .orient("left")
    .tickSubdivide(true)
    .tickFormat(function (d) {
      if (d < 0) return '';
      return d;
    });

  vis.append("svg:g")
    .attr("class", "network-axis")
    .attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")")
    .call(xAxis);
  
  vis.append("g") // Axis label
    .attr("class", "profile-axis")
    .append("text")
    .attr("x", ((WIDTH-MARGINS.right) / 2) + 40)
    .attr("y", HEIGHT + MARGINS.bottom - 20)
    .style("text-anchor", "center")
    .text("Year");

  vis.append("svg:g")
    .attr("class", "network-axis")
    .attr("transform", "translate(" + (MARGINS.left) + ",0)")
    .call(yAxis)
    .append("text") // Add axis label
      .attr("transform", "rotate(-90)")
      .attr("y", -50) // reverse due to rotate (y is x, x is y)
      .attr("x", -HEIGHT/2)
      .style("text-anchor", "end")
      .text("Number of Students");

  // Set linear reg.
  for (i in lineData) {
    var line = lineData[i];
    var yval = line.map(function(d) { return d.total; });
    var xval = line.map(function(d) { return parseInt(d.year, 10); });
    lineData[i].reg = profile.linearRegression(yval, xval);
    lineData[i].regNormal = line.reg.slope / 160; // Assumes 160 is a steep slope in the data set.
    lineData[i].regNormal = (lineData[i].regNormal > 1) ? 1 : lineData[i].regNormal;
    lineData[i].regNormal = (lineData[i].regNormal < -1) ? -1 : lineData[i].regNormal;
    lineData[i].regNormal = lineData[i].regNormal / 2;
    lineData[i].regNormal += 0.5;
  }
  
  // Extent of lin. regressions. Useful for determining color min / max.
  // Some slopes seen while testing:
  //  -27, 55
  //  -162, 92
  // var extent = d3.extent(lineData, function(d){ return d.reg.slope; });
  // console.log('Extent of lin. reg. is', extent);
  
  // Label and anchor arrays for Labeler
  var larray = [];
  var aarray = [];
  
  // Draw lines
  for (i in lineData) {
    var line = lineData[i];
    var x = lineData[i].regNormal;
    
    // A quantitative scale of colors shows minute difference in trend.
    // var lineColor = d3.interpolateBrBG(x);
    
    // Simple scale, 2 up, 2 down. Consider 0 as up.
    // http://colorbrewer2.org/#type=diverging&scheme=RdYlBu&n=5
    var lineColor;
    if (x >= 0.55) {        // rising
      lineColor = '#2c7bb6';
    } else if (x >= 0.5) {
      lineColor = '#abd9e9';
    } else if (x >= 0.45) { // falling
      lineColor = '#fdae61';
    } else { // >0
      lineColor = '#d7191c';
    }
    if (filterTrend) {
      if (filterTrend == 1 && x < 0.55) {
        continue;
      }
      if (filterTrend == 2
        && (x > 0.55 || x < 0.5)) {
        continue;
      }
      if (filterTrend == 3
        && (x > 0.5 || x < 0.45)) {
        continue;
      }
      if (filterTrend == 4 && x > 0.45) {
        continue;
      }
    }
    
    var lineFunc = d3.svg.line()
      .x(function (d) {
        return xRange(parseInt(d.year, 10));
      })
      .y(function (d) {
        // log scale
        //    var l = (d.total > 0) ? d.total : 0.0000001;
        //    return yRange(Math.log(l));
        return yRange(d.total);
      })
      .interpolate('linear');
    
    var lineTitle = [];
    for (var i=0; i<line.length; i++) {
      lineTitle.push(line[i].total);
    }
    
    var p = vis.append("svg:path")
      .attr("d", lineFunc(line))
      .attr("stroke", lineColor)
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("class", "hasPointer")
      .attr("schoolName", line[0].school)
      .attr("id", line[0].id)
      .attr("lTitle", lineTitle.join(','))
      .attr("lastYear", line[line.length - 1].year) // Attr to track last year of data (if closed)
      .attr("lSlope", Math.round(line.reg.slope * 10) / 10)
      .on("mouseover", function(d) {
        // use "v1" of d3 in this function
        var d3 = d3_version1;
        this.setAttribute('stroke-width', 6);
        // Removing labels
        // =============================================================
            //~ var idrl = '#paRightLabels'
              //~ + this.getAttribute('schoolName').replace(/[^\w]/g, '-');
            //~ d3.select(idrl).transition()
              //~ .duration(80)
              //~ .style('font-weight', 'bold')
              //~ .style('font-size', '12px');
        // =============================================================
        var n = this.getAttribute('schoolName') + '<br/>'
          + 'Slope: '
          + this.getAttribute('lSlope');// + '<br/>'
          //~ + 'Pop.: ' + this.getAttribute('lTitle')
        divToolTip.html(n)
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
        divToolTip.transition()
          .duration(80)
          .style('opacity', 0.95)
          .style('border', '1px solid #333');
      })
      .on("mouseout", function(d) {
        // use "v1" of d3 in this function
        var d3 = d3_version1;
        this.setAttribute('stroke-width', 2);
        divToolTip.transition()
          .duration(100)
          .style('opacity', 0)
          .style('border', 'none');
        // Removing labels
        // =============================================================
            //~ var idrl = '#paRightLabels'
              //~ + this.getAttribute('schoolName').replace(/[^\w]/g, '-');
            //~ d3.select(idrl).transition()
              //~ .duration(80)
              //~ .style('font-weight', 'normal')
              //~ .style('font-size', d3.select(idrl).node().fontSizeInit);
        // =============================================================
      })
      .on("click", function(d) {
        // Opens single school for review
        if (schoolProfile.currentView.schoolComparison == true) {
          schoolProfile.load(
            [this.getAttribute('id')],
            this.getAttribute('lastYear')
          );
        } else {
          // Nothing?
        }
      });
    // Removing labels
    // =================================================================
        // Right side line labels
        //~ var finalY = yRange(line[line.length-1].total);
        //~ // Add label.
        //~ larray.push({
          //~ x: WIDTH-MARGINS.right+3,
          //~ y: finalY,
          //~ name: line[0].school,//.replace(/(([\w])([\w]+))*/g, '$2'),
        //~ });
        //~ aarray.push({
          //~ x: WIDTH-MARGINS.right+3,
          //~ y: finalY,
          //~ r: 0.01
        //~ });
    // =================================================================
  }
  
  // Removing labels
  // ===================================================================
      //~ // Basic label
      //~ // Draw labels
      //~ var labels = vis.selectAll(".paRightLabelsLineChart")
        //~ .data(larray)
        //~ .enter()
        //~ .append("text")
        //~ .attr("class", "profile-axis paRightLabelsLineChart")
        //~ .attr("x", function(d) { return (d.x); })
        //~ .attr("y", function(d) { return (d.y); })
        //~ .attr("dy", ".35em")
        //~ .attr("text-anchor", "start")
        //~ .style("fill", "steelblue")
        //~ .attr("id", function(d) {
            //~ var idrl = 'paRightLabels' + d.name.replace(/[^\w]/g, '-');
            //~ return idrl;
        //~ })
        //~ .text(function(d) {
          //~ return d.name.replace(/(([\w])[\w]+)*/g, '$2').replace(/[\.\- ]/g, '');
        //~ })
        //~ .on("mouseover", function(d) {
        //~ });
      
      //~ // W/H
      //~ // Scale the size of text based on # of labels, to keep it from
      //~ // exploding over the chart.
      //~ // Set temporary key fontSizeInit to track size.
      //~ var idx = 0;
      //~ labels.each(function() {
        //~ if (larray.length > 30) {
          //~ this.style.fontSize = (30 / larray.length) + 'em';
          //~ this.fontSizeInit = (30 / larray.length) + 'em';
        //~ }
        //~ larray[idx].width = this.getBBox().width;
        //~ larray[idx].height = this.getBBox().height;
        //~ idx += 1;
      //~ });
        
      //~ // Labeler
      //~ d3.labeler()
        //~ .label(larray)
        //~ .anchor(aarray)
        //~ .width(WIDTH)
        //~ .height(HEIGHT)
        //~ .start(800); // # of passes
      
      //~ labels
        //~ .transition()
        //~ .duration(1600)
        //~ .attr("x", function(d) { return (d.x); })
        //~ .attr("y", function(d) { return (d.y); });
  // ===================================================================
}

/**
 * @brief Linear regression code
 * 
 * @reference
 *    This code makes reference to a stack overflow thread:
 *    https://stackoverflow.com/questions/20507536/d3-js-linear-regression
 */
profile.linearRegression = function(y, x) {
  var lr = {};
  var n = y.length;
  var sum_x = 0;
  var sum_y = 0;
  var sum_xy = 0;
  var sum_xx = 0;
  var sum_yy = 0;
  for (var i = 0; i < y.length; i++) {
    sum_x += x[i];
    sum_y += y[i];
    sum_xy += (x[i]*y[i]);
    sum_xx += (x[i]*x[i]);
    sum_yy += (y[i]*y[i]);
  }
  lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
  lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
  lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);
  return lr;
};

/**
 * @brief Make a stacked bar. Better for displaying many schools at once.
 * 
 * @reference https://bl.ocks.org/mbostock/3020685
 * 
 * @notes If it is only one school, then show the pop. of each
 *    demographic.
 * 
 * @param schoolArray Array of school ids
 * @param filterTrend Number of trend to filter, 1-4, or false to show all
 */
schoolProfile.stackedBar = function(schoolArray, filterTrend) {
  
  var d3 = d3_version1;
  
  // format
  // {schoolid, value (i.e., population), year}
  var data = [];
  for (var yearAS in model.data.allSchools) {
    var y = parseInt(yearAS, 10);
    var addedIDs = {};
    for (var i in schoolArray) {
      var id = schoolArray[i];
      
      // Only do it once.
      // For some issue, a few zip codes have multiple schools with
      // same ID. So it's causing double entry here.
      if (addedIDs[id]) continue;
      
      addedIDs[id] = true;
      
      //Single schools
      if (schoolArray.length == 1) {
        
        // If not here
        if (!model.data.allSchools[yearAS].hasOwnProperty(id)
         || !model.data.allSchools[yearAS][id].hasOwnProperty('demography')
         || !model.data.allSchools[yearAS][id].demography.hasOwnProperty('abbr')
         ) {
          continue;
        }
        
        for (var j in model.data.allSchools[yearAS][id].demography.abbr) {
          var v = model.data.allSchools[yearAS][id].demography.abbr[j];
          if (!/No$/.exec(j)) continue;
          if (v.toString() == 'NaN') v = 0;
          var nextEl = {
           id: j,
           value: v,
           year: y,
          };
          data.push(nextEl);
        }
          
      } else {
        // Multi Schools
        
        // Add zero if not here
        if (!model.data.allSchools[yearAS].hasOwnProperty(id)
         || !model.data.allSchools[yearAS][id].hasOwnProperty('total')) {
          var nextEl = {
           id: id,
           value: 0,
           year: y,
          };
          data.push(nextEl);
          continue;
        }
        
        // Otherwise, add the data
        var nextEl = {
         id: id,
         value: schoolProfile.lineCompareSumDemos(
                  model.data.allSchools[yearAS][id]
                ),
         //~ model.data.allSchools[yearAS][id].total,
         year: y,
        };
        data.push(nextEl);
      }
    }
  }
  
  var xy1 = d3.select('#profile').node().getBoundingClientRect();
  var xy2 = d3.select('#profile-content').node().getBoundingClientRect();
  
  var margin = {top: 20, right: 30, bottom: 30, left: 50},
    width = xy1.width - margin.left - margin.right - 40, // Additional 40px
    height = xy1.height - xy2.height - margin.top - margin.bottom - 20; // Additional 20

  var xRange = d3.scale.linear()
    .range([margin.left, width - margin.right])
    .domain( [2014, 2019] );
  var yRange = d3.scale.linear()
    .range([height, 0]);
    
  var z = d3.scale.category20c();
  
  var xAxis = d3.svg
    .axis()
    .scale(xRange)
    .ticks(5)
    .orient("bottom")
    .tickFormat(function (d) {
      if (d == 2019) return "'19";
      else if (d == 2018) return "'18";
      else if (d == 2017) return "'17";
      else if (d == 2016) return "'16";
      else if (d == 2015) return "'15";
      else if (d == 2014) return "'14";
    })
    .innerTickSize(-height)
    .outerTickSize(0);
  var yAxis = d3.svg.axis()
    .scale(yRange)
    .orient("left")
    .tickSubdivide(true)
    .tickFormat(function (d) {
      if (d < 0) return '';
      return d;
    });
    
  var stack = d3.layout.stack()
    .offset("zero")
    .values(function(d) { return d.values; })
    .x(function(d) { return d.year; })
    .y(function(d) { return d.value; });

  var nest = d3.nest()
    .key(function(d) { return d.id; });
  
  var area = d3.svg.area()
    .interpolate("cardinal")
    .x(function(d) { return xRange(d.year); })
    .y0(function(d) { return yRange(d.y0); })
    .y1(function(d) { return yRange(d.y0 + d.y); });

  var svg = schoolProfile.html.lineContainer
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var n = nest.entries(data);
  
  // Sort, largest on the bottom
  
  // For multi
  if (schoolArray.length > 1) {
    // Need average of a school over the five years before creating chart data.
    // Utilize model.data.schoolFiveYearMean
    // Another option here is to sort by trend, then by mean.
    // That is, all rising on the bottom, then mid-rise, then mid-fall,
    // and finally falling on top.
    n.sort(function(a, b) {
      return model.data.schoolFiveYearMean[b.key] - model.data.schoolFiveYearMean[a.key];
    });
  } else {
    // For single
    // Sort by largest demographic on bottom.
    n.sort(function(a, b) {
      var sumValuesA = 0
      var sumValuesB = 0;
      var numA = 0;
      var numB = 0;
      for (var i in a.values) {
        sumValuesA += a.values[i].value;
        numA ++;
      }
      for (var i in b.values) {
        sumValuesB += b.values[i].value;
        numB ++;
      }
      return (sumValuesB / numB) - (sumValuesA / numA);
    });
  }
  
  var layers = stack(n);
  
  xRange.domain(d3.extent(data, function(d) { return d.year; }));
  yRange.domain([0, d3.max(data, function(d) { return d.y0 + d.y; })]);
  
  if (filterTrend) {
    var layersTmp = [];
    for (var i in layers) {
      var x = profile.lineRegNormalize(layers[i].values);
      if (filterTrend == 1 && x >= 0.55) {
        layersTmp.push(layers[i]);
      }
      if (filterTrend == 2
        && (x < 0.55 && x >= 0.5)) {
        layersTmp.push(layers[i]);
      }
      if (filterTrend == 3
        && (x < 0.5 && x >= 0.45)) {
        layersTmp.push(layers[i]);
      }
      if (filterTrend == 4 && x < 0.45) {
        layersTmp.push(layers[i]);
      }
    }
    layers = layersTmp;
  }
  
  svg.selectAll(".layerPSB")
    .data(layers)
    .enter()
    .append("path")
      .attr("class", "layerPSB")
      .style("cursor", "pointer")
      .attr("stroke-width", '0.5')
      .attr("stroke", '#2a2a2a')
      .attr("d", function(d) { return area(d.values); })
      .style("fill", function(d, i) {
        return profile.trendColor(
          profile.lineRegNormalize(d.values)
        );
      })
      .on("click", function(d) {
        // Opens school if multi, nothing if single.
        // Must select a year when pop. > 0, otherwise there is no data.
        if (d.key.indexOf('No') != -1) {
          //
        } else {
          for (var yearAS=2019; yearAS>=2014; yearAS--) {
            if (model.data.allSchools[yearAS].hasOwnProperty(d.key)) {
              schoolProfile.currentView.currentSchoolArray = [d.key];
              schoolProfile.currentView.currentSchoolYear = yearAS;
              break;
            }
          }
        }
        // Load profile
        schoolProfile.load(
          schoolProfile.currentView.currentSchoolArray,
          schoolProfile.currentView.currentSchoolYear
        );
      })
      .on("mouseover", function(d) {
        // use "v1" of d3 in this function
        var d3 = d3_version1;
        this.setAttribute('stroke-width', 2);
        var n = '';
        
        // single or multi
        if (d.key.indexOf('No') != -1) {
          n = d.key.replace(/No$/, '');
        } else {
          for (var yearAS in model.data.allSchools) {
            if (model.data.allSchools[yearAS].hasOwnProperty(d.key)
              && model.data.allSchools[yearAS][d.key].hasOwnProperty('School Name')
              ) {
              n = model.data.allSchools[yearAS][d.key]['School Name'];
              break;
            }
          }
        }
        
        divToolTip.html(n)
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
        divToolTip.transition()
          .duration(200)
          .style('opacity', 0.95);
      })
      .on("mouseout", function(d) {
        // use "v1" of d3 in this function
        var d3 = d3_version1;
        this.setAttribute('stroke-width', 0.5);
        divToolTip.transition()
          .duration(500)
          .style('opacity', 0);
      })
      ;

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);
}
/**
 * Provides a linear regression slope between 0 (falling) and 1 (rising).
 * 
 * @param values Array of objects with a population statistic ("value")
        values: [
          0: {id: "609715", value: 2537, year: 2014},
          1: {id: "609715", value: 2290, year: 2015},
          2: {id: "609715", value: 2248, year: 2016},
          3: {id: "609715", value: 2075, year: 2017},
          4: {id: "609715", value: 1891, year: 2018},
          5: {id: "609715", value: 1918, year: 2019}
        ]
 */
profile.lineRegNormalize = function(values) {
  var yval = values.map(function(d) { return d.value; });
  var xval = values.map(function(d) { return d.year; });
  var reg = profile.linearRegression(yval, xval);
  var regNormal = reg.slope / 160; // Assumes 160 is a steep slope in the data set.
  regNormal = (regNormal > 1) ? 1 : regNormal;
  regNormal = (regNormal < -1) ? -1 : regNormal;
  regNormal = regNormal / 2;
  regNormal += 0.5;
  return regNormal;
}
profile.trendColor = function(x) {
  if (x >= 0.55) {        // rising
    return '#2c7bb6';
  } else if (x >= 0.5) {
    return '#abd9e9';
  } else if (x >= 0.45) { // falling
    return '#fdae61';
  } else { // >0
    return '#d7191c';
  }
}
  
  
/**
 * @brief Make bar graph.
 */
schoolProfile.barDemographics = function(schoolArray, year) {
  /** Desired format
    var d1 = [
        { "Demographic": "Hispanic", "stat": 2600 },
        ...
    ];
  */
  //~ console.log(schoolArray, year);
  
  // use "v1" of d3 in this function
  var d3 = d3_version1;
  
  // If multi-schools, then this is combination of all schools
  var allDems = {};
  var allDemsTotal = 0;
  for (var i in schoolArray) {
    var id = schoolArray[i];
    try {
      var m = model.data.allSchools[year][id].demography.abbrShortest; // Not .abbr
      for (var key in m) {
        if (/No$/.exec(key)) {
          var outKey = key.replace(/No$/, '');
          if (allDems.hasOwnProperty(outKey)) {
            allDems[ outKey ] += m[key];
          } else {
            allDems[ outKey ] = m[key];
          }
          allDemsTotal += m[key];
        }
      }
    } catch(e) {
      console.log(
        'WARN: Cannot not find school with ID ' + id
        + ' in year ' + year
      );
    }
  }
  // All HS
  var allDemsHsTotal = 0;
  for (var i in schoolArray) {
    var id = schoolArray[i];
    try {
      var m = model.data.highSchools[year][id]['9_12'];
      allDemsHsTotal += m;
    } catch(e) {
      console.log(
        'WARN: Cannot not find school with ID ' + id
        + ' in year ' + year
      );
    }
  }
  
  // Add to display
  var pmc = d3.select('#profile-multi-counts');
  pmc.html( 
    'HS/All: ('
    +'<span title="Number of HS-only students compared" class="profile-multi-tooltip">'
    + allDemsHsTotal + '</span>'
    + '/<span title="Number of students compared" class="profile-multi-tooltip">'
    + allDemsTotal + '</span>)'
  );
  
  // Return here for single schools
  if (!schoolProfile.currentView.schoolComparison) {
    return;
  } else {
  }
  
  // Reset any previous
  schoolProfile.html.barContainer.selectAll('*').remove();
  
  var d1 = [];
  for (var key in allDems) {
    d1.push({
      'Demographic': key,
      'stat': allDems[key]
    });
  }
  
  var pad = {w: 40, top: 20, h: 40};
  
  var height = 60//80;
  var width = d3.select('#profile-multi-bar').node().getBoundingClientRect().width;
  width -= pad.w * 2;
  
  var yScale = d3.scale.linear()
    .domain([0, d3.max(d1, function(d) { return d.stat; })]) 
    .range([height, 0]);
  var xScale = d3.scale.ordinal()
    .domain(d1.map(function(d) { return d.Demographic; }))
    .rangeRoundBands([0, width], 0.1);
  
  var svg = schoolProfile.html.barContainer
    .append("svg")
    .attr("width", width + (pad.w * 2))
    .attr("height", height + (pad.h + pad.top))
    .attr("fill", '#ef')
    .append("g")
    .attr("transform",
          "translate("+ pad.w +","+ pad.top +")");

  svg.selectAll("rect")
    .data(d1)
    .enter()
    .append("rect")
      .attr("class", "profile-bar-rect")
      .attr("stroke", "blue")
      .attr('stroke-width', 0)
      .attr("x", function (d) { return xScale(d.Demographic) + pad.w; })
      .attr("y", function(d) { return yScale(d.stat); })
      .attr("height", function (d) { return height - yScale(d.stat); })
      .attr("width", xScale.rangeBand())
      .attr("fill", "cornflowerblue") // Not red
      .attr("syear", year)
      .on("mouseover", function(d) {
        // use "v1" of d3 in this function
        var d3 = d3_version1;
        this.setAttribute('stroke-width', 1);
        var n = 'student';
        n += (d.stat > 1) ? 's' : '';
        divToolTip.html(d.stat + ' ' + n)
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
        divToolTip.transition()
          .duration(200)
          .style('opacity', 0.95);
      })
      .on("mouseout", function(d) {
        // use "v1" of d3 in this function
        var d3 = d3_version1;
        this.setAttribute('stroke-width', 0);
        divToolTip.transition()
          .duration(500)
          .style('opacity', 0);
      })
      .on("click", function(d) {
        // Opens only this demo in line charts, but only when
        // in comparison mode.
        for (var i in schoolProfile.html.filters.lineCompare) {
          var cb = schoolProfile.html.filters.lineCompare[i];
          cb.checked = false;
        }
        document.getElementById('inp-'+d.Demographic).checked = true;
        schoolProfile.redraw();
      });
  
  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .ticks(4);
  svg.append("g")
    .attr("class", "profile-axis")
    .attr("transform", "translate("+ pad.w +", 0)")
    .call(yAxis)
    .append("text") // Add axis label
      .attr("transform", "rotate(-90)")
      .attr("y", -50) // reverse due to rotate (y is x, x is y)
      .attr("x", -20)
      .style("text-anchor", "end")
      .text("# Students");

  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom");
  svg.append("g")
    .attr("class", "profile-axis")
    .attr("transform", "translate("+ (pad.w) +", "+ height +")")
    .call(xAxis)
    .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-10px")
      .attr("dy", "2px")
      .attr("transform", "rotate(-65)")
  //~ svg.append("g") // Axis label
    //~ .attr("class", "profile-axis")
    //~ .append("text")
    //~ .attr("x", (width / 2))
    //~ .attr("y", height + pad.h - 80)
    //~ .style("text-anchor", "center")
    //~ .text("Demographic");
}
