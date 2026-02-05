import * as d3 from "d3"

const margin = {top: 40, right: 60, bottom: 40, left: 60};

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const selectContainer = document.getElementById('select-container');

// Use nodeSize for fixed spacing [height, width]
const treemap = d3.tree().nodeSize([60, 250]); 

const stratify = d3.stratify()
    .id((d: any) => d.id)
    .parentId((d: any) => d.parentid);

selectContainer?.addEventListener('change', async (e) => {
    const target = e.target as HTMLSelectElement;
    // Ensure we are targeting the correct SVG based on the select's data-index
    const index = target.getAttribute('data-index');
    const treeId = target.value;

    const svgSelection = d3.select(`#tree-svg-${index}`);
    
    // Clear previous drawings
    svgSelection.selectAll("*").remove();
    
    // Reset attributes to ensure clean slate
    svgSelection
        .attr("width", null)
        .attr("height", null)
        .style("width", null)
        .style("height", null);

    try {            
        const response = await fetch(`/api/genealogy/${treeId}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        // 1. Process Data
        const root = stratify(data);
        const genealogyData = treemap(root);
        const nodes = genealogyData.descendants();
        const links = genealogyData.links();

        // 2. Calculate Tree Bounds
        // d3.tree() centers root at (0,0), so we need absolute min/max to size the box
        let minX = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        nodes.forEach((d: any) => {
            const sideMultiplier = d.data.position === "left" ? -1 : 1;
            // x is horizontal, y is vertical in this transform
            d.y = d.depth * 180 * sideMultiplier; 
            
            if (d.x < minX) minX = d.x;
            if (d.x > maxX) maxX = d.x;
            if (d.y > maxY) maxY = d.y;
        });

        // 3. Determine Exact Content Dimensions
        // We do NOT check the container width here. We size the SVG to the content.
        const treeWidth = maxX - minX;
        const totalHeight = maxY + margin.top + margin.bottom + 50;
        
        const finalSvgWidth = treeWidth + margin.left + margin.right;
        const finalSvgHeight = totalHeight;

        // 4. Apply Logic: Auto-Center via CSS
        // By setting the SVG to exactly the size of the tree and using margin: auto,
        // it will center itself if the container is larger, or scroll if container is smaller.
        svgSelection
            .attr("width", finalSvgWidth)
            .attr("height", finalSvgHeight)
            .style("display", "block") // Required for margin auto to work
            .style("margin", "0 auto"); // Centers horizontally

        // 5. Draw
        // Shift the tree so the leftmost node starts at margin.left
        // (minX is usually negative, so -minX shifts it positive)
        const xShift = -minX + margin.left;
        
        const g = svgSelection.append("g")
            .attr("transform", `translate(${xShift}, ${margin.top})`);

        // Links
        g.selectAll(".link")
            .data(links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("stroke-width", "1.5px")
            .attr("d", (d: any) => {
                return `M ${d.source.x} ${d.source.y}
                        C ${d.source.x} ${(d.source.y + d.target.y) / 2}
                          ${d.target.x} ${(d.source.y + d.target.y) / 2}
                          ${d.target.x} ${d.target.y}`;
            });

        // Nodes
        const nodeGroup = g.selectAll(".node")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);

        nodeGroup.append("circle")
            .attr("r", 10)
            .style("fill", "#fff")
            .style("stroke", "steelblue")
            .style("stroke-width", "3px")
            .on("mouseover", function (event, d: any) {
                tooltip.style("opacity", .9);
                tooltip.html(
                    `<strong>${d.data.name}</strong><br/>` +
                    (d.data.age_when_father ? `Father at: ${d.data.age_when_father}<br/>` : "") +
                    (d.data.age_when_dead ? `Died at: ${d.data.age_when_dead}` : "")
                );
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("opacity", 0);
            });

        nodeGroup.append("text")
            .attr("dy", "-1.5em")
            .attr("text-anchor", "middle")
            .text((d: any) => d.data.name)
            .style("fill", "black")
            .style("stroke", "white")
            .style("stroke-width", "4px")
            .style("stroke-linejoin", "round")
            .style("paint-order", "stroke");

    } catch (error) {
        console.error(error);
    }
});