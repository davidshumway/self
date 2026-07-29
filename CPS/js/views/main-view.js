/**
 * Main view of program.
 * 
 * Handles onload and onresize events and adds info box behaviour
 * for any info boxes (blue circle with "i" inside).
 * Also adds yearOpts and yearSliderHandler global variables,
 * as well as initialize the yearSlider element.
 * Adds click events for Overview and About buttons.
 * Adds click event for Overview cookie checkbox.
 * 
 */
 
// Globals
var bubbleCtrl;
var bubbleOpts = {};

window.onload = function() {
  windowLoadFunc();
}

function windowLoadFunc() {
  // Sizing
  var c = document.getElementsByClassName('main-view-map')[0];
  c.style.height = window.innerHeight + 'px';
  // Half
  var c = document.getElementsByClassName('main-view-four');
  for (var i=0; i<c.length; i++) {
    c[i].style.height = ((window.innerHeight+2)/2) + 'px';
  } 
  
  // Click events for overview, about, overview cookie
  d3.select('#btn-main-overview').on('click', function(d) {
    schoolProfile.lightbox(
      function(parentNode) {
        var c = parentNode.container;
        c.html(d3.select('#div-main-overview').html());
        var s = c.select('#cb-load-overview');
        s.node().checked = (localStorage['cps-load-overview'] == '1')
          ? true : false;
        s.on('click', function(d) {
          if (this.checked) {
            localStorage['cps-load-overview'] = '1';
          } else {
            localStorage['cps-load-overview'] = '0';
          }
        });
      }
    );
  });
  d3.select('#btn-main-about').on('click', function(d) {
    schoolProfile.lightbox(
      function(parentNode) {
        parentNode.container.html(d3.select('#div-main-about').html());
      }
    );
  });
  
  // Init charts
  bubbleCtrl = new schoolBubbleController();
  model.init(bubbleCtrl.extractSchools);
  model.init(networkCharts.loadSchoolsNC);
  model.init(loadSchoolsSBC);
  schoolProfile.require();
  
  // Load welcome pop-up
  if (localStorage
      && localStorage['cps-load-overview'] != undefined) {
    if (localStorage['cps-load-overview'] == '1') {
      d3.select('#btn-main-overview').node().click();
    } // else 0
  } else { // Shown on first run
    localStorage['cps-load-overview'] = '1';
    d3.select('#btn-main-overview').node().click();
  }
}

window.onresize = function () {

  // Sizing
  var c = document.getElementsByClassName('main-view-map')[0];
  c.style.height = window.innerHeight + 'px';
  // Half
  var c = document.getElementsByClassName('main-view-four');
  for (var i=0; i<c.length; i++) {
    c[i].style.height = ((window.innerHeight+2)/2) + 'px';
  }
  
  // Re-display all charts.
  // Assumes each chart determines its new size.
  networkCharts.networkSort();
  schoolProfile.stretch();
  loadSchoolsSBC();
};

var yearOpts = {
  currentYear: 2019,
  mapOpts: mapOpts,
  bubbleOpts: bubbleOpts
}

var yearSliderHandler = function (year) {
    yearOpts.currentYear = year;
    yearOpts.mapOpts.resetSchoolLayer();
    yearOpts.mapOpts.fireZipClick();
    yearOpts.bubbleOpts.yearSliderHandler(year);
    loadSchoolsSBC();
};

loadSlider("slider-map", yearSliderHandler);

/**
 * Info boxes
 */
d3.selectAll('.more-info')
  .on("mouseover", function(d) {
    divToolTip.html(this.getAttribute('data'))
      .style('left', (d3.event.pageX) + 'px')
      .style('top', (d3.event.pageY - 28) + 'px');
    divToolTip.transition()
      .duration(200)
      .style('opacity', 0.95);
  })
  .on("mouseout", function(d) {
    this.setAttribute('stroke-width', 0);
    divToolTip.transition()
      .duration(500)
      .style('opacity', 0);
  });


















