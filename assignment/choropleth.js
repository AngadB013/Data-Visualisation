// Load world map geojson
d3.json("custom.geo.json").then(function (worldMap) {
    // Load choropleth data
    d3.csv("choropleth_map.csv").then(function (data) {
        // Remove data for the year 2022
        data = data.filter(function (d) {
            return +d.Year <= 2021;
        });

        // Initialize map parameters
        var width = 960;
        var height = 600;

        // Create SVG element
        var svg = d3.select("#map")
            .attr("width", width)
            .attr("height", height);

        // Initialize projection
        var projection = d3.geoMercator()
            .fitSize([width, height], worldMap);

        // Initialize path generator
        var path = d3.geoPath()
            .projection(projection);

        // Define color scale for original view
        var originalColorScale = d3.scaleSequential(d3.interpolateRdYlBu)
            .domain([d3.max(data, function (d) {
                return +d.Total;
            }), 0]);

        // Define color scale for color-blind view
        var colorBlindColorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([d3.max(data, function (d) {
                return +d.Total;
            }), 0]);

        // Create slider
        var slider = d3.select("#slider")
            .on("input", function () {
                var year = this.value;
                updateMap(year);
    });

        // Zoom behavior
        var zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", function(event) {
                if (event.sourceEvent && event.sourceEvent.type === "wheel") return; // Ignore mouse scroll zoom
                zoomed(event);
            });

        function zoomed(event) {
            svg.selectAll('path')
                .attr('transform', event.transform);
        }

        // Call the zoom behavior on the SVG (without scrolling)
        svg.call(zoom)
            .on("wheel.zoom", null); // Disable the mouse wheel zoom

        // Zoom in and out buttons
        d3.select("#zoom-in").on("click", function() {
            zoom.scaleBy(svg.transition().duration(750), 1.2);
        });

        d3.select("#zoom-out").on("click", function() {
            zoom.scaleBy(svg.transition().duration(750), 0.8);
        });

        // Reset position button event
        d3.select("#reset-position").on("click", function() {
            svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        });


// Function to update map based on selected year and heatmap type
function updateMap(year) {
    d3.select("#year").text(year);

    var selectedOption = document.getElementById("heatmap-type").value;

    var selectedColorScale = selectedOption === "original" ? originalColorScale : colorBlindColorScale;

    svg.selectAll("path")
        .style("fill", function (d) {
            var countryData = data.find(function (item) {
                return item.Year === year && item.Country === d.properties.admin && !isNaN(+item.Total);
            });
            return countryData ? selectedColorScale(+countryData.Total) : "lightgrey";
        });

    updateLegend(selectedColorScale);
}

// Draw map
var paths = svg.selectAll("path")
    .data(worldMap.features)
    .enter().append("path")
    .attr("d", path)
    .style("fill", function (d) {
        var countryData = data.find(function (item) {
            return item.Country === d.properties.admin;
        });
        return countryData ? originalColorScale(countryData.Total) : "lightgrey";
    })
.on("mouseover", handleMouseOver)
.on("mouseout", handleMouseOut);

function handleMouseOver(event, d) {
// Get the current year from the slider
var year = d3.select("#slider").node().value;

// Filter the data for the selected country and year
var countryData = data.filter(function (item) {
    return item.Country === d.properties.admin && item.Year === year;
});

// Remove existing tooltip
d3.select(".tooltip").remove();

// Create tooltip
var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .html(function () {
        var totalMigration = countryData.length > 0 ? +countryData[0].Total : "N/A";
        return `<strong>${d.properties.admin}</strong><br>Annual Migration in ${year}: ${totalMigration}`;
    })
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 28) + "px");

// Show charts
showCharts(d.properties.admin, data);
}

function handleMouseOut() {
    // Remove tooltip
    d3.select(".tooltip").remove();

    // Remove charts
    d3.select("#line-chart-container").selectAll("*").remove();
}

// Function to show charts
function showCharts(country, data) {
    // Filter data for the selected country
    var countryData = data.filter(function (d) {
        return d.Country === country && d.Total !== "NA";
    });

    // Extract years and values
    var years = countryData.map(function (d) {
        return +d.Year;
    });
    var values = countryData.map(function (d) {
        return +d.Total;
    });

    // Set up dimensions for the charts
    const margin = { top: 50, right: 50, bottom: 50, left: 80 };
    const chartWidth = 510 - margin.left - margin.right;
    const chartHeight = 350 - margin.top - margin.bottom;

    // Create SVG element for line chart
    const lineChartContainer = d3.select("#line-chart-container")
        .append("div")
        .attr("class", "line-chart")
        .style("width", chartWidth + margin.left + margin.right + "px")
        .style("height", chartHeight + margin.top + margin.bottom + "px");

    lineChartContainer.append("div")
        .attr("class", "chart-title")
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text(`Migration trend for ${country}`);

    const lineChartSvg = lineChartContainer.append("svg")
        .attr("width", chartWidth + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create SVG element for scatter plot
    const scatterPlotContainer = d3.select("#line-chart-container")
        .append("div")
        .attr("class", "scatter-plot")
        .style("width", chartWidth + margin.left + margin.right + "px")
        .style("height", chartHeight + margin.top + margin.bottom + "px");

    scatterPlotContainer.append("div")
        .attr("class", "chart-title")
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text(`Migration trend for ${country}`);

    const scatterPlotSvg = scatterPlotContainer.append("svg")
        .attr("width", chartWidth + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Define scales and axes for line chart
    const xScaleLine = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([0, chartWidth]);

    const yScaleLine = d3.scaleLinear()
        .domain([0, d3.max(values)])
        .range([chartHeight, 0]);

    const xAxisLine = d3.axisBottom(xScaleLine).tickFormat(d3.format("d"));
    const yAxisLine = d3.axisLeft(yScaleLine);

    // Define scales and axes for scatter plot
    const xScaleScatter = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([0, chartWidth]);

    const yScaleScatter = d3.scaleLinear()
        .domain([0, d3.max(values)])
        .range([chartHeight, 0]);

    const xAxisScatter = d3.axisBottom(xScaleScatter).tickFormat(d3.format("d"));
    const yAxisScatter = d3.axisLeft(yScaleScatter);

    // Add line to line chart
    const line = d3.line()
        .x((d, i) => xScaleLine(years[i]))
        .y(d => yScaleLine(d));

    lineChartSvg.append("path")
        .datum(values)
        .attr("class", "line")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-width", 2);

        // Add axes to line chart
        lineChartSvg.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(xAxisLine);

        lineChartSvg.append("g")
            .call(yAxisLine);

        // Add axis labels to line chart
        lineChartSvg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .style("font-family", "Arial, sans-serif")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + margin.bottom - 10})`)
            .text("Year");

        lineChartSvg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .style("font-family", "Arial, sans-serif")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .attr("transform", `translate(${-margin.left + 20}, ${chartHeight / 2})rotate(-90)`)
            .text("Total Migration");

        // Add scatter plot points
        scatterPlotSvg.selectAll("circle")
            .data(values)
            .enter().append("circle")
            .attr("cx", (d, i) => xScaleScatter(years[i]))
            .attr("cy", d => yScaleScatter(d))
            .attr("r", 5)
            .attr("fill", "red");

        // Add axes to scatter plot
        scatterPlotSvg.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(xAxisScatter);

        scatterPlotSvg.append("g")
            .call(yAxisScatter);

        // Add axis labels to scatter plot
        scatterPlotSvg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .style("font-family", "Arial, sans-serif")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + margin.bottom - 10})`)
            .text("Year");

        scatterPlotSvg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .style("font-family", "Arial, sans-serif")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .attr("transform", `translate(${-margin.left + 20}, ${chartHeight / 2})rotate(-90)`)
            .text("Total Migration");
            }

    // Function to update legend
    function updateLegend(colorScale) {
        var legend = d3.select("#color-legend");
        legend.selectAll("*").remove();

        var legendData = d3.range(6).map(function (d) {
            return colorScale.domain()[0] + (d * (colorScale.domain()[1] - colorScale.domain()[0]) / 5);
        });

        var legendItem = legend.selectAll(".legend-item")
            .data(legendData)
            .enter().append("div")
            .attr("class", "legend-item")
            .style("text-align", "center");

        legendItem.append("div")
            .attr("class", "legend-box")
            .style("background-color", function (d) {
                return colorScale(d);
            });

        legendItem.append("div")
            .attr("class", "legend-text")
            .style("font-family", "Arial, sans-serif")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(function (d, i) {
                if (i === 0) {
                    return "< " + Math.round(d);
                } else if (i === legendData.length - 1) {
                    return "> " + Math.round(d);
                } else {
                    return Math.round(legendData[i - 1]) + " - " + Math.round(d);
                }
        });
    }

    // Initial update
    updateMap("2010");

    // Update map when heatmap type changes
    d3.select("#heatmap-type")
        .on("change", function () {
            var year = slider.property("value");
            updateMap(year);
            });
    });
});
