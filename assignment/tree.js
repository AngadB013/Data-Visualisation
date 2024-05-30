document.addEventListener("DOMContentLoaded", function() {
    d3.csv("gdp.csv").then(data => {
        // Format data
        let formattedData = {};
        data.forEach(d => {
            if (!formattedData[d.Year]) {
                formattedData[d.Year] = [];
            }
            formattedData[d.Year].push({
                country: d.Entity,
                gdp_per_capita: +d["GDP per capita"]
            });
        });

        const years = Object.keys(formattedData).map(Number).sort((a, b) => a - b);
        const width = 960;
        const height = 500;

        const treemap = d3.treemap()
            .size([width, height])
            .padding(1)
            .round(true);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const svg = d3.select("#treemap").append("svg")
            .attr("width", width)
            .attr("height", height);

        const slider = document.getElementById("slider");
        const yearLabel = document.getElementById("year-label");

        slider.addEventListener("input", function() {
            const year = this.value;
            yearLabel.textContent = year;
            update(year);
        });

        function update(year) {
            console.log("Updating year:", year);
            const root = d3.hierarchy({ children: formattedData[year] })
                .sum(d => d.gdp_per_capita);

            console.log("Hierarchy root:", root);

            treemap(root);

            const nodes = svg.selectAll(".node")
                .data(root.leaves(), d => d.data.country);

            nodes.enter().append("rect")
                .attr("class", "node")
                .merge(nodes)
                .attr("x", d => d.x0)
                .attr("y", d => d.y0)
                .attr("width", d => d.x1 - d.x0)
                .attr("height", d => d.y1 - d.y0)
                .style("fill", d => color(d.data.country))
                .append("title") // Add title to newly appended nodes
                .text(d => `${d.data.country}: ${d.data.gdp_per_capita}`);

            nodes.merge(nodes)
                .transition()
                .attr("x", d => d.x0)
                .attr("y", d => d.y0)
                .attr("width", d => d.x1 - d.x0)
                .attr("height", d => d.y1 - d.y0)
                .style("fill", d => color(d.data.country));

            nodes.exit().remove();
        }

        update(years[0]);
    }).catch(error => {
        console.error('Error loading or parsing data:', error);
    });
});
