
function loadSchoolsSBC(){
  var allHS = [];
  for (var i in cpsData.rows) {
    var r = cpsData.rows[i];
    if (r[5].indexOf('High School') == 0) {
      allHS.push(r);
    }
  }
  var yr14Schools;
  var yr14HSDemos = [];

  var attributes = ["African American", "Hispanic", "White",
    "Asian", "Asian/↵Pacific Islander↵(Retired)",
    "Hawaiian/↵Pacific Islander", "Mulit-Racial",
    "Native American/↵Alaskan"]; 
  var matched14HS = [];
  for(var i = 0; i < yr14HSDemos.length; i++){
      for(var j = 0; j < allHS.length; j++){
          var hsID = allHS[j];
          var yr14HS = yr14HSDemos[i];
          if(yr14HS["School ID"] == hsID[0]){
              matched14HS.push(yr14HSDemos[i]);
          }
      }
  }

  let clickedKeys = [];
  let totalData = [];
  let reorderKeys = [];
  let reorderColors = [];
  let stackedSeries;
  let w = 3500;
  let h = d3.select('#main-view-stacked')
    .node()
    .getBoundingClientRect().height
    - d3.select('#toolbar-stackedBar')
    .node()
    .getBoundingClientRect().height 
    - 10 ; // changing from 900
  let margin = {
      top: 10,
      bottom: 80,
      left: 50,
      right: 120,
  };
  let width = w - margin.left - margin.right;
  let height = h - margin.top - margin.bottom;
  let colors = ['#011627', '#FF3366', '#2EC4B6', '#8AAA79',
    '#837569', '#FFF07C', '#6369D1', '#B0FE76'];
  let colorsOrder = ['#011627', '#FF3366', '#2EC4B6',
    '#8AAA79', '#837569', '#FFF07C', '#6369D1', '#B0FE76'];

  d3.select("#main-view-stacked svg").remove();
  d3.select(".legendSBC ul").remove();
  
  var selectBox = document.getElementById("year");
  var year = selectBox.innerText;
  var idx = 0;
  if(year == 2019){idx = 0;}
  else if(year == 2018){idx = 1;}
  else if(year == 2017){idx = 2;}
  else if(year == 2016){idx = 3;}
  else if(year == 2015){idx = 4;}
  else if(year == 2014){idx = 5;}
  
  var highSchools = [];
  for(var i in model.filesToLoad.Demography[idx].data){
      if(i!=0){
        for(const key of Object.keys(model.data.highSchools[year])){
            if(model.filesToLoad.Demography[idx].data[i]["School ID"] == key){
                if (model.filesToLoad.Demography[idx].data[i].Network == '') continue;
                if (model.filesToLoad.Demography[idx].data[i].Network == 'Dsitrict Total') continue;
                if (model.filesToLoad.Demography[idx].data[i].Network == 'District Total') continue;
                highSchools.push(model.filesToLoad.Demography[idx].data[i]);
            }
        }
    }
  }

  let keys = [];
  let keysOrder = [];
  if(year == 2015 || year == 2014 || year == 2016){
      keys = ["African AmericanNo", "HispanicNo", "WhiteNo", "Native American/AlaskanNo", "Asian/Pacific Islander(Retired)No", "Mulit-RacialNo", "AsianNo", "Not AvailableNo"];
  } else if(year == 2017){
      keys = ["African AmericanNo", "HispanicNo", "WhiteNo", "Native American/AlaskanNo", "Asian/ Pacific Islander (Retired)No", "Multi-RacialNo", "AsianNo", "Not AvailableNo"];
  } else if(year == 2018){
      keys = ["African AmericanNo", "HispanicNo", "WhiteNo", "Native American/AlaskanNo", "Asian/ Pacific Islander (Retired)No", "Mulit-RacialNo", "AsianNo", "Not AvailableNo"];
  } else {
      keys = ["African AmericanNo", "HispanicNo", "WhiteNo", "Native American/AlaskanNo", "Asian/ Pacific Islander (Retired)No", "Multi-RacialNo", "AsianNo", "Not AvailableNo"];
  }
  keysOrder = ["AA", "HI", "WH", "NM", "AP", "MR", "AS", "NA"];  

  let dataToStack = highSchools;

  function getKeys() {
      return keys;
  }

  function createStack() {
      stack = d3.stack()
      .keys(getKeys());
      stackedSeries = stack(dataToStack);
  }

  createStack();

  var chart, svg, x, y, n;

  drawChart();

  function drawChart() {
    d3.select("#main-view-stacked svg").remove();
    x = d3.scaleBand()
      .domain(dataToStack.map(function(d){
              if(year == 2016 || year == 2015){
                  return d["Education Units"];
              }else if (year == 2014){
                  return d["Educational Unit"]
              }
              return d["School Name"]; // n = n.replace(/^([^ ]+) ([^ ]+)[\d\D]+/, '$1 $2...');
          }))
      .rangeRound([0,width])
      .padding(0.05);

    y = d3.scaleLinear()
      .domain([0, d3.max(stackedSeries, function(d) {
          return d3.max(d, (d) => {
                  return d[1];
              })
      })])
      .range([height, 0]);

    svg = d3.select('.chart').append('svg')
      .attr('class', 'chart')
      .attr('width', w)
      .attr('height', h);

    chart = svg.append('g')
      .classed('graph', true)
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const layersBarArea = chart.append('g')
      .attr('class', 'layers');

    layersBarArea.selectAll('g.layer').remove();

    let layersBar = layersBarArea.selectAll('.layer').data(stackedSeries)
      .enter()
      .append('g')
      .attr('barIndex', function(d, i) { return i; })
      .on("mouseover", function(d, i) { 
      })
      .attr('class', 'layer')
      .style('fill', (d, i) => {
          return colors[i];
      });

    layersBar.selectAll('rect')
      .data((d) => {
          return d
      })
      .enter()
      .append('rect')
        .attr('d', function(d) { return d; })
        .attr('i', function(d, i) { return i; })
        .style('cursor', 'pointer')
        .on('click', function(d, i) {
          if (d3.event.shiftKey) {
            schoolProfile.addToCompare(d.data['School ID']);
          } else {
            schoolProfile.load(
              [d.data['School ID']],
              yearOpts.currentYear
            );
          }
        })
        .on("mouseover", function(d, i) { 
          // i is demographic index
          // d is school row
          // also available in dataToStack[i],
          // although this is invalid if sorted
          var barIndex = this.parentNode
            .getAttribute('barIndex');
          
          var dm = keys[barIndex].replace(/No$/, '');
          var sname;
          if (d.data['School Name']) {
            sname = d.data['School Name'];
          } else if (d.data['Education Units']) {
            sname = d.data['Education Units'];
          } else if (d.data['Educational Unit']) {
            sname = d.data['Educational Unit'];
          }
              
          divToolTip.html("*****Demographic: "
              + dm + 
              "<br/>*****School: " + sname + 
              "<br/>*****Demographic Population: " + d.data[keys[barIndex]])
            .style('left', (d3.event.pageX) + 'px')
            .style('top', (d3.event.pageY - 28) + 'px');
          divToolTip.transition()
            .duration(200)
            .style('opacity', 0.95)
            .style('border', '1px solid #333');
        })
        .on("mouseout", function() { 
          divToolTip.transition()
            .duration(500)
            .style('opacity', 0);
        })
        .attr('height', 0)
        .attr("y", h - margin.bottom - margin.top)
        .attr('x', (d, i) => {
          if (year == 2016 || year == 2015){
              return x(d.data["Education Units"]);
          } else if (year == 2014){
              return x(d.data["Educational Unit"]);
          }
          return x(d.data["School Name"])
        })
        .attr('width', x.bandwidth())
        .transition()
        .duration(400)                            
        .attr('height', (d, i) => {
          if(d[1] == NaN || d[0] == NaN){return 0;}
          return y(d[0]) - y(d[1]);
        })
        .attr('y', (d) => {
          if(d[1] == NaN ){return 0;}
          return y(d[1]);
        });
        
    var gx = chart.append('g')
      .classed('x----axis', true)
      .attr("transform", "translate(0," + (height) + ")")
      .call(d3.axisBottom(x))
      .style('text-anchor', 'start')
      .selectAll("text")
      .attr("transform", "rotate(45)")
      .text(function(d) { // Shorten titles
        // By num words
          // return d.replace(/^([^ ]+) ([^ ]+)[\d\D]+/, '$1 $2...');
        // By num chars
        return d.replace(/^([\d\D]{10})[\d\D]+/, '$1...');
      });
    
    chart.append('g')
      .classed('y axis', true)
      .call(d3.axisLeft(y)
      .ticks(10));
  }

  let legend = d3.select(".legendSBC").append('ul');

  let legendItems = legend.selectAll('li')
    .data(keysOrder)
    .enter()
    .append('li')
    .attr('data-key', (d, i)=>{
      return d;
    })
    .attr('data-index', (d, i)=>{
      return i;
    })
    .attr('data-color', (d, i)=>{
      return colors[i];
    })
    .on('click', function(d) {
      // Which key
      var dem = '';
      for (var i in keysOrder) {
        if (keysOrder[i] == d) {
          dem = keys[i]; // Corresponds to full key
          break;
        }
      }
      dataToStack.sort(function(a, b) {
        return parseFloat(b[dem])
            - parseFloat(a[dem])
      });
      drawChart();
    });

  legendItems.append('span')
    .attr('class', 'rectSBC')
    .style('cursor', 'pointer')
    .style('background-color', (d, i) =>{
      return colors[i];
    });

  legendItems.append('span')
    .attr('display', 'inline')
    .attr('font-weight', 'bold')
    .attr('text-align', 'center')
    .attr('white-space', 'nowrap')
    .attr('vertical-align', 'baseline')
    .attr('line-height', '1')
    .attr('border-radius', '.25em')
    .attr('font-size', '75%')
    .attr('padding', '.2em .6em .3em')
    .attr('color', '#000000')
    .html((d) => {
      return d
    });
      
      
}
