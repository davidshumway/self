// Credits: https://github.com/UsabilityEtc/d3-country-bubble-chart

var createBubbleChart = function () {
    var currentDemography = '';  // None indicates All.
    
    if (!bubbleCtrl || !bubbleCtrl.getSchoolsByYear) { // Failed to load??
        console.log('WARN(!!!): window.onload fails!');
        try {
            console.log(bubbleCtrl);
            console.log(bubbleCtrl.getSchoolsByYear);
        } catch(e) {
            console.log('e:',e);
        }
        d3.select('#main-view-bubble').append('span').text('(Failed to load view)');
        return;
    }
    
    var schools = bubbleCtrl.getSchoolsByYear(2019); // Start with 2019
    var schoolNetworkNames = bubbleCtrl.getSchoolNetworksDict(schools);
    var populations = schools.map(s => +s.totalStudents);
    var meanPopulation = d3.mean(populations),      // TODO: use
        populationExtent = d3.extent(populations),
        populationScaleX,
        populationScaleY;

    var schoolNetworks = d3.set(schools.map(function (s) { return s.network; }));
    var schoolNetworkColorScale = function(id) {
        //model.data.schoolFiveYearPopTrend[b.key]
        var v = [];
        for (var yearAS=2014; yearAS<=2019; yearAS++) {
            if (model.data.allSchools[yearAS].hasOwnProperty(id)) {
                v.push({
                    year: yearAS,
                    value: model.data.allSchools[yearAS][id].total,
                });
            }
        }
        return profile.trendColor(
          profile.lineRegNormalize(v)
        );
    }
    
    // Reduce from 1200 x 680
    var width = d3.select('#main-view-bubble')
        .node()
        .getBoundingClientRect().width - 20; // Pad 6
    var height = d3.select('#main-view-bubble')
        .node()
        .getBoundingClientRect().height
        - d3.select('#main-view-bubble>.row1')
        .node()
        .getBoundingClientRect().height - 10;//680*0.5;
        
    var svg,
        circles,
        circleSize = getCircleSize(populationExtent[1]);
    var circleRadiusScale = d3.scaleSqrt()
        .domain(populationExtent)
        .range([circleSize.min, circleSize.max]);

    var forces,
        forceSimulation;

    createSVG();
    toggleschoolNetworkKey(true);
    createCircles();
    createForces();
    createForceSimulation();
    addFillListener();
    addGroupingListeners();
    createDemographyDropdown();

    function createSVG() {
        svg = d3.select("#bubble-chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
    }

    function createDemographyDropdown() {
        var select = document.getElementById("demography");
        // Create default option
        var option = document.createElement('option');
        option.text = "All";
        option.value = '';
        option.setAttribute('selected', '');
        select.appendChild(option);

        var dLabels = bubbleCtrl.demographyLabels;
        Object.keys(dLabels).forEach(l => {
            var opt = document.createElement('option');
            opt.text = l;
            opt.value = l;
            select.appendChild(opt);
        });

        // Hook demography handler
        $('#demography').on('change', function () {
            currentDemography = $(this).val();
            schools = currentDemography
                ? bubbleCtrl.filterStudentsByDemography(currentDemography, yearOpts.currentYear)
                : bubbleCtrl.getSchoolsByYear(yearOpts.currentYear); // TODO
            recreateChart();
        });
    }

    function recreateChart() {
        width = d3.select('#main-view-bubble') // Update width
            .node()
            .getBoundingClientRect().width - 20;
        height = d3.select('#main-view-bubble')
            .node()
            .getBoundingClientRect().height
            - d3.select('#main-view-bubble>.row1')
            .node()
            .getBoundingClientRect().height - 10;//680*0.5;
            //~ console.log('height',height);
        populations = schools.map(s => +s.totalStudents);
        populationExtent = d3.extent(populations);
        circleSize = getCircleSize(populationExtent[1]);
        circleRadiusScale = d3.scaleSqrt()
            .domain(populationExtent)
            .range([circleSize.min, circleSize.max]);
        resetCircles();
        createForces();
        createForceSimulation();

        // Reset axes
        var xAxis = d3.select(".x-axis"),
            yAxis = d3.select(".y-axis");
        xAxis.remove();
        yAxis.remove();
        togglePopulationAxes(populationGrouping());
        //addFillListener();
        //updateForces(populationGrouping() ? forces.population : forces.combine);
    }

    // Handling for circle size when population range fluctuates too much.
    function getCircleSize(pMax) {
        return {
            'min': 1,
            'max': pMax < 1500 && schools.length > 400 ? 6 : 12
        };
    }

    function yearSliderHandler(year) {
        // currentYear = year;
        schools = currentDemography
            ? bubbleCtrl.filterStudentsByDemography(currentDemography, yearOpts.currentYear)
            : bubbleCtrl.getSchoolsByYear(yearOpts.currentYear);
        schoolNetworkNames = bubbleCtrl.getSchoolNetworksDict(schools);
        schoolNetworks = d3.set(schools.map(function (s) { return s.network; }));
        d3.select(".schoolNetwork-key").remove();
        toggleschoolNetworkKey(!populationGrouping());
        recreateChart();
    }

    function toggleschoolNetworkKey(showschoolNetworkKey) {
    }

    function isChecked(elementID) {
        return d3.select(elementID).property("checked");
    }

    function resetCircles() {
        circles = svg.selectAll("circle");
        circles.remove();
        circles = null;
        createCircles();
    }

    function createCircles() {
        var formatPopulation = d3.format(",");
        circles = svg.selectAll("circle")
            .data(schools)
            .enter()
            .append("circle")
            //~ .attr('id', function(d) {
                //~ return 'bubble-circ-'+d.id;
            //~ })
            .attr("r", function (d) {
                return circleRadiusScale(d.totalStudents);
            })
            .on("mouseover", function (d) {
                updateschoolInfo(d);
            })
            .on("mouseout", function (d) {
                updateschoolInfo();
            })
            .style("cursor", "pointer")
            .on("click", function (d) {
                schoolProfile.load(
                  [d.id],
                  yearOpts.currentYear
                );
            });
        
        circles.exit().remove();
        
        updateCircles();

        function updateschoolInfo(school) {
            if (school) {
                var info = [school.schoolName, formatPopulation(school.totalStudents)].join(": ");
                if (school.id && model.data.byId[school.id]
                    && model.data.byId[school.id]['PopulationSlope (0-1)'])
                {
                    var x = model.data.byId[school.id]['PopulationSlope (0-1)'];
                    info += '<br/>Pop. Trend: ' + ((x >= 0.5) ? 'Rising' : 'Falling');
                }
                divToolTip.html(info)
                  .style('left', (d3.event.pageX) + 'px')
                  .style('top', (d3.event.pageY - 28) + 'px');
                divToolTip.transition()
                  .duration(200)
                  .style('opacity', 0.95);
            } else {
                divToolTip.transition()
                  .duration(500)
                  .style('opacity', 0);
            }
            //~ d3.select("#school-info").html(info);
        }
    }

    function updateCircles() {
        circles
            .attr("fill", function (d) {
                return schoolNetworkColorScale(d.id);
            });
    }

    function createForces() {
        var forceStrength = 0.05;

        forces = {
            combine: createCombineForces(),
            population: createPopulationForces()
        };

        function createCombineForces() {
            return {
                x: d3.forceX(width / 2).strength(forceStrength),
                y: d3.forceY(height / 2).strength(forceStrength)
            };
        }

        function createPopulationForces() {
            var schoolNetworkNamesDomain = schoolNetworks.values().map(function (schoolNetworkCode) {
                return schoolNetworkNames[schoolNetworkCode];
            });
            var scaledPopulationMargin = circleSize.max;

            populationScaleX = d3.scaleBand()
                .domain(schoolNetworkNamesDomain)
                .range([scaledPopulationMargin, width - scaledPopulationMargin * 2]);
            populationScaleY = d3.scaleLog()
                .domain(populationExtent)
                .range([height - scaledPopulationMargin, scaledPopulationMargin * 2]);

            var centerCirclesInScaleBandOffset = populationScaleX.bandwidth() / 2;
            return {
                x: d3.forceX(function (d) {
                    var val = populationScaleX(schoolNetworkNames[d.network]) + centerCirclesInScaleBandOffset;
                    if (!val)
                        console.log(schoolNetworkNames[d.network]);
                    return val;
                }).strength(forceStrength),
                y: d3.forceY(function (d) {
                    return populationScaleY(d.totalStudents);  // TODO: totalStudents shouldn't be empty
                }).strength(forceStrength)
            };
        }

    }

    function createForceSimulation() {
        if (forceSimulation)
            forceSimulation.stop();

        var force = populationGrouping() ? forces.population : forces.combine;

        forceSimulation = d3.forceSimulation()
            .force("x", force.x)
            .force("y", force.y)
            .force("collide", d3.forceCollide(forceCollide));

        $(forceSimulation.nodes(schools)).unbind();

        forceSimulation.nodes(schools)
            .on("tick", function () { // every tick.
                circles
                    .attr("cx", function (d) {
                        //~ console.log('fs d', d);
                        return d.x;
                    })
                    .attr("cy", function (d) {
                        return d.y;
                    });
            });
    }

    function forceCollide(d) {
        return populationGrouping() ? 0 : circleRadiusScale(d.totalStudents) + 1;
    }

    function populationGrouping() {
        return isChecked("#population");
    }

    function addFillListener() {
        $(d3.selectAll('input[name="fill"]')).unbind();

        d3.selectAll('input[name="fill"]')
            .on("change", function () {
                toggleschoolNetworkKey(!populationGrouping());
                updateCircles();
            });
    }

    function updateForces() {
        forceSimulation
            .force("x", forces.population.x)
            .force("y", forces.population.y)
            .force("collide", d3.forceCollide(forceCollide))
            .alphaTarget(0.5)
            .restart();
        
        // Bug: The network bubble "bar" chart hangs CPU at 100%
        //      and never stops! Calling stop() method will stop it.
        //~ bubbleOpts.fs = forceSimulation;
        setTimeout(function(d) {
            console.log('stopping bubble');
            if (forceSimulation && forceSimulation.stop)
                forceSimulation.stop();
        }, 6000);
    }

    function addGroupingListeners() {
        addListener("#combine");
        addListener("#population");

        function addListener(selector) {
            d3.select(selector).on("click", function () {
                // Work around for the force issue when switching bubble view
                if (populationGrouping())
                    updateForces(); // This is basically population force
                else {
                    createForceSimulation();
                }

                toggleschoolNetworkKey(!populationGrouping());
                togglePopulationAxes(populationGrouping());
            });
        }
    }

    function togglePopulationAxes(showAxes) {
        var onScreenXOffset = 40,
            offScreenXOffset = -40;
        var onScreenYOffset = 90,
            offScreenYOffset = 100;

        if (d3.select(".x-axis").empty()) {
            createAxes();
        }
        var xAxis = d3.select(".x-axis"),
            yAxis = d3.select(".y-axis");

        if (showAxes) {
            translateAxis(xAxis, "translate(0," + (height - onScreenYOffset) + ")");
            translateAxis(yAxis, "translate(" + onScreenXOffset + ",0)");
        } else {
            translateAxis(xAxis, "translate(0," + (height + offScreenYOffset) + ")");
            translateAxis(yAxis, "translate(" + offScreenXOffset + ",0)");
        }

        function createAxes() {
            var numberOfTicks = 10,
                tickFormat = ".0s";

            var xAxis = d3.axisBottom(populationScaleX)
                .ticks(numberOfTicks, tickFormat);

            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", "translate(0," + (height + offScreenYOffset) + ")")
                .call(xAxis)
                .selectAll(".tick")
                .attr("font-size", "10px")
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dy", "0.25em")
                .attr("transform", "rotate(-65)");

            var yAxis = d3.axisLeft(populationScaleY)
                .ticks(numberOfTicks, tickFormat);
            svg.append("g")
                .attr("class", "y-axis")
                .attr("transform", "translate(" + offScreenXOffset + ",0)")
                .call(yAxis);
        }

        function translateAxis(axis, translation) {
            axis
                .transition()
                .duration(500)
                .attr("transform", translation);
        }
    }
    
    bubbleOpts.yearSliderHandler = yearSliderHandler;
    bubbleOpts.ref = this;
};
