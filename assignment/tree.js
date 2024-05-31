const width = 850;
const height = 550;
const treemap = d3.treemap().size([width, height]).paddingInner(1);
const svg = d3.select('#chart').append('svg').attr('width', width).attr('height', height);
const legendSvg = d3.select('#legend').append('svg').attr('width', 200).attr('height', 600); // Adjust the width and height as needed

let nodes;
let colorScale;
let data;

d3.csv('gdp.csv').then((csvData) => {
data = csvData;
const allGdpValues = data.map(d => +d['GDP per capita']);
const overallMinGDP = d3.min(allGdpValues);
const overallMaxGDP = d3.max(allGdpValues);

// Define custom thresholds for the legend based on the overall data
const thresholds = d3.range(overallMinGDP, overallMaxGDP, (overallMaxGDP - overallMinGDP) / 5);

// Create a threshold scale and reverse the color range
colorScale = d3.scaleThreshold()
.domain(thresholds)
.range(d3.schemeRdYlBu[6].reverse()); // Reverse the color scheme

updateTreemap('2010'); // Initial render

const slider = document.getElementById('slider');
const yearLabel = document.getElementById('year-label');

slider.addEventListener('input', function () {
const year = this.value;
yearLabel.textContent = year;
updateTreemap(year);
});

function updateTreemap(year) {
const newData = data.filter(d => d.Year == year);
const root = d3.hierarchy({ children: newData }).sum(d => +d['GDP per capita']).sort((a, b) => b.value - a.value);
treemap(root);

if (nodes) nodes.remove(); // Remove previous nodes

// Remove previous nodes and labels
svg.selectAll('.node').remove();
svg.selectAll('.country-label').remove();

// Create new nodes and labels
nodes = svg.selectAll('.node')
.data(root.descendants())
.enter()
.append('g')
.attr('class', 'node')
.attr('transform', d => `translate(${d.x0},${d.y0})`);

nodes
.append('rect')
.attr('width', d => d.x1 - d.x0)
.attr('height', d => d.y1 - d.y0)
.attr('fill', d => d.children ? 'none' : colorScale(d.data['GDP per capita']))
.attr('class', d => d.children ? null : 'node--leaf')
.on('mouseover', showTooltip)
.on('mousemove', moveTooltip)
.on('mouseleave', hideTooltip);

// Append text elements for country names
nodes.append('text')
.attr('x', 3)
.attr('y', 13)
.text(d => d.data.Entity ? d.data.Entity : 'Unknown')
.attr('class', 'country-label');

updateLegend(overallMinGDP, overallMaxGDP); // Update legend with overall min and max GDP values

// Remove previous country labels
svg.selectAll('.country-label').remove();

// Append text elements for country names directly to the SVG container
svg.selectAll('.country-label')
.data(root.descendants())
.enter()
.append('text')
.attr('class', 'country-label')
.attr('x', d => d.x0 + 3)
.attr('y', d => d.y0 + 13)
.text(d => d.data.Entity || 'Unknown');

}

function updateLegend(minGDP, maxGDP) {
// Remove previous legend items
legendSvg.selectAll('*').remove();

// Define the legend
const legend = d3.legendColor()
  .shapeWidth(50) // Set the shape width to fill the space
  .shapeHeight(90) // Adjust shape height as needed
  .shapePadding(0) // No padding between shapes
  .labels(getLabels(thresholds, minGDP, maxGDP)) // Use custom labels
  .scale(colorScale);

// Create a g element for the legend
const legendGroup = legendSvg.append('g')
  .attr('class', 'legend')
  .attr('transform', 'translate(20, 20)');

// Call the legend and render it
legendGroup.call(legend);
}

// Helper function to format GDP values for legend labels
function formatValue(value) {
return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Helper function to generate custom labels for the legend
function getLabels(thresholds, minGDP, maxGDP) {
const labels = [];
const thresholdValues = [...thresholds, maxGDP]; // Include the maximum value

for (let i = 0; i < thresholdValues.length; i++) {
  const currentValue = thresholdValues[i];
  const nextValue = thresholdValues[i + 1];

  if (i === 0) {
    labels.push(`≥ $${formatValue(currentValue)}`);
  } else if (i === thresholdValues.length - 1) {
    labels.push(`< $${formatValue(currentValue)}`);
  } else {
    labels.push(`$${formatValue(currentValue)} - $${formatValue(nextValue - 1)}`);
  }
}

return labels;
}

// Function to show tooltip and highlight the hovered node
function showTooltip(event, d) {
const tooltip = d3.select('.legend-tooltip');
const gdpPerCapita = d.data['GDP per capita'];
const countryName = d.data.Entity;
const year = d.data.Year;
const tooltipContent = `Country: ${countryName}<br/>GDP Per Capita: $${gdpPerCapita}<br/>(International Rate in Year ${year})`;

tooltip.html(tooltipContent)
.style('display', 'block')
.style('left', (event.pageX + 10) + 'px')
.style('top', (event.pageY - 10) + 'px')
.style('font-family', 'Arial, sans-serif')
.style('font-weight', 'bold')
.style('font-size', '14px')
.style('color', '#333')
.style('background-color', '#fff')
.style('border', '1px solid #ccc')
.style('border-radius', '5px')
.style('padding', '10px')
.style('box-shadow', '0 2px 4px rgba(0, 0, 0, 0.1)');
}

// Function to move tooltip
function moveTooltip(event) {
const tooltip = d3.select('.legend-tooltip');
tooltip.style('left', (event.pageX + 10) + 'px')
  .style('top', (event.pageY - 10) + 'px');
}

// Function to hide tooltip and remove highlight from the node
function hideTooltip() {
const tooltip = d3.select('.legend-tooltip');
tooltip.style('display', 'none');

// Remove highlight from the node
d3.select(this)
.attr('stroke', 'none');
}

});
