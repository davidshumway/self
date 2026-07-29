/**
 * @author: David Shumway
 * @brief: A network overview for all schools.
 * @reference: For the chart, the following tutorial is referenced:
 * 	https://swizec.com/blog/quick-scatterplot-tutorial-for-d3-js/swizec/5337
 */

// Singleton network chart object
var networkCharts = {}

networkCharts.loadSchoolsNC = function() {
    /** Desired format
    model.data.networkProfile.data.school = [
        {network: "Network 14", stat: 20243, year: 2019},
        {network: "Network 14", stat: 0, year: 2018},
        ...
        ...
    ];
    */
    
    networkCharts.addFilters();
    
    // Display the charts
    d3.select("#main-view-network").append('div').node().id = 'network-charts';
    networkCharts.addChart(model.data.networkProfile.hs.data.school,
      model.data.networkProfile.hs.maxSchools, 6, 'Schools per network');
    networkCharts.addChart(model.data.networkProfile.hs.data.student,
      model.data.networkProfile.hs.maxStudents, 6, 'Students per network');
      
    // Network Sort
    // Default on reload always reads "Sort By".
    d3.select("#network-sort").on("change", networkCharts.networkSort);
    d3.select("#network-sort").node().selectedIndex = 0;
    d3.select("#nf-schools1").on("change", networkCharts.networkSort);
    d3.select("#nf-schools2").on("change", networkCharts.networkSort);
}

networkCharts.addFilters = function() {
  // nf
  d3.select("#main-view-network").node().appendChild(
    d3.select('#div-network-filters').node()
  );
  d3.select('#div-network-filters').node().style.display = 'block';
}

networkCharts.networkSort = function() {
  d3.select("#network-charts").selectAll("*").remove();
  var x = document.getElementById('network-sort');
  var v = x.options[x.selectedIndex].value;
  switch(v) {
    case '1':
      // all
      model.data.networkProfile.all.data.school.sort(process.sortFunctionAB);
      model.data.networkProfile.all.data.student.sort(process.sortFunctionAB);
      // hs
      model.data.networkProfile.hs.data.school.sort(process.sortFunctionAB);
      model.data.networkProfile.hs.data.student.sort(process.sortFunctionAB);
      break;
    case '2':
      // all
      model.data.networkProfile.all.data.school.sort(process.sortFunctionSchoolsAll);
      model.data.networkProfile.all.data.student.sort(process.sortFunctionSchoolsAll);
      // hs
      model.data.networkProfile.hs.data.school.sort(process.sortFunctionSchoolsHs);
      model.data.networkProfile.hs.data.student.sort(process.sortFunctionSchoolsHs);
      break;
    case '3':
      // all
      model.data.networkProfile.all.data.school.sort(process.sortFunctionStudentsAll);
      model.data.networkProfile.all.data.student.sort(process.sortFunctionStudentsAll);
      // hs
      model.data.networkProfile.hs.data.school.sort(process.sortFunctionStudentsHs);
      model.data.networkProfile.hs.data.student.sort(process.sortFunctionStudentsHs);
      break;
  }
  var type = (d3.select('#nf-schools1').node().checked) ? 'all' : 'hs';
  networkCharts.addChart(
    model.data.networkProfile[type].data.school,
    model.data.networkProfile[type].maxSchools,
    6,
    'Schools per network'
  );
  networkCharts.addChart(
    model.data.networkProfile[type].data.student,
    model.data.networkProfile[type].maxStudents,
    6,
    'Students per network'
  );
}

/**
 * 
 * @param data        Obj 
 * @param total       Int Max. value in any given year
 * @param numYears    Int
 * @param chartTitle  Str
 */
networkCharts.addChart = function(data, total, numYears, chartTitle) {
  
  // use d3 "v1" in this function
  var d3 = d3_version1;
  
  // Dimensions
  var dm = d3.select("#main-view-network").node().getBoundingClientRect();
  var dmnf = d3.select("#div-network-filters").node().getBoundingClientRect();
  
  var w = (dm.width - 20) / 2;
  // #main-view-network - #div-network-filters
  var h = dm.height - dmnf.height - 20; //300;
  var wpad = 40;
  var hpad = 20;
  var left_pad = 80;

  var svg = d3.select("#network-charts")
      .append("svg")
      .attr("style", "outline: thin solid #999;")
      .attr("width", w)
      .attr("height", h);
      
  var x = d3.scale.linear()
    .domain([2014, 2019])
    .range([left_pad, w-wpad]);
  var y = d3.scale.ordinal()
    .domain(data.map(function(d) { return d.network; }))
    .rangeRoundBands([hpad, h-(hpad)], 0.1);
  
  //~ var topAxis = d3.svg
    //~ .axis()
    //~ .scale(x)
    //~ .orient("top")
    //~ .tickFormat(function (d) {
      //~ if (d == 2019) return "18-19";
      //~ else if (d == 2018) return "17-18";
      //~ else if (d == 2017) return "16-17";
      //~ else if (d == 2016) return "15-16";
      //~ else if (d == 2015) return "14-15";
      //~ else if (d == 2014) return "13-14";
    //~ })
    //~ .innerTickSize(-h)
    //~ .outerTickSize(0);
  var xAxis = d3.svg
    .axis()
    .scale(x)
    .orient("bottom")
    .ticks(5)
    .tickFormat(function (d) {
      if (d == 2019) return "'19";
      else if (d == 2018) return "'18";
      else if (d == 2017) return "'17";
      else if (d == 2016) return "'16";
      else if (d == 2015) return "'15";
      else if (d == 2014) return "'14";
    })
    .innerTickSize(-h)
    .outerTickSize(0);
  var yAxis = d3.svg
    .axis()
    .scale(y)
    .orient("left")
    .ticks(data.length)
    .innerTickSize(-w)
    .outerTickSize(0)
    .tickFormat(function (d) {
      if (d == 'Service Leadership Academies') return "SLA";
      if (d.indexOf('Network ') == 0) {
        return d.replace(/Network /, '#');
      }
      else return d;
    })
    ;

  svg.append("g")
    .attr("class", "network-axis")
    .attr("transform", "translate(0, "+(h-hpad)+")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "network-axis")
    .attr("transform", "translate("+(left_pad-wpad)+", 0)")
    .call(yAxis);
  
  svg.append("g") // Axis label
    .attr("class", "network-axis")
    .append("text")
    .attr("x", w/2 - 30)
    .attr("y", 10)
    .style("text-anchor", "center")
    .style("font-weight", "bold")
    .text(chartTitle);
    
  // max_w should be the largest data point in all years
  // e.g. If network 13 in year 2015 had most schools in network,
  // everything would be relative to this network?
  var max_w = d3.max(data.map(function (d) {
    return d.stat;
  }));
  rect_w = d3.scale.linear()
    .domain([0, total])
    .range([0, w/numYears]);

  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
      .attr("class", "network-rect")
      .attr("x", function (d) { return x(d.year) - ((rect_w(d.stat)*0.4) / 2); })
      .attr("y", function (d) { return y(d.network); })
      .attr("width", function (d) { return rect_w(d.stat) * 0.4; })
      .attr("height", '8px')
      .attr("ctitle", chartTitle)
      .on('click', function(d) {
        if (d3.select('#nf-schools1').node().checked) { // load all
          schoolProfile.load(
            model.data.networks.all.schools[d.network][d.year].schoolIDs,
            d.year
          )
        } else { // load hs only
          schoolProfile.load(
            model.data.networks.hs.schools[d.network][d.year].schoolIDs,
            d.year
          )
        }
      })
      .on('mouseover', function(d) {
        var n;
        if (this.getAttribute('ctitle') == 'Schools per network') {
          n = 'school'
        } else {
          n = 'student';
        }
        n += (d.stat > 1) ? 's' : '';
        divToolTip.html(d.stat + ' ' + n)
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
        divToolTip.transition()
          .duration(200)
          .style('opacity', 0.95)
          .style('border', '1px solid #333');
        })
      .on('mouseout', function(d) {
        divToolTip.transition()
          .duration(500)
          .style('opacity', 0);
      });
}
