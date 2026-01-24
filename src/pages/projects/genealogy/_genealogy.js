import * as d3 from "d3"
const genealogyData = {
        name: "Adam",
        age_when_father: 130,
        age_when_dead: 930,
        children: [
            {
                name: "Seth",
                age_when_father: 105,
                age_when_dead: 912,
                children: [
                    {
                        name: "Enosh",
                        age_when_father: 90,
                        age_when_dead: 905,
                        children: [
                            {
                                name: "Kenan",
                                age_when_father: 70,
                                age_when_dead: 910,
                                children: [
                                    {
                                        name: "Mahalalel",
                                        age_when_father: 65,
                                        age_when_dead: 895,
                                        children: [
                                            {
                                                name: "Jared",
                                                age_when_father: 162,
                                                age_when_dead: 962,
                                                children: [
                                                    {
                                                        name: "Enoch",
                                                        age_when_father: 65,
                                                        age_when_dead: 365,
                                                        children: [
                                                            {
                                                                name: "Methuselah",
                                                                age_when_father: 187,
                                                                age_when_dead: "969",
                                                                children: [
                                                                    {
                                                                        name: "Lamech",
                                                                        age_when_father: 182,
                                                                        age_when_dead: 777,
                                                                        children: [
                                                                            {
                                                                                name: "Noah",
                                                                                age_when_father: "500",
                                                                            }
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
        ]
    };

    const margin = {top: 40, right: 60, bottom: 40, left: 60};
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip");

    const svg = d3.select("#tree-svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let i = 0;
    const duration = 750;
    let root;

    //const treemap = d3.tree().size([height, width]);
    const treemap = d3.tree().nodeSize([50, 200]);
    root = d3.hierarchy(genealogyData, function (d) {
        return d.children;
    });
    root.x0 = height / 2;
    root.y0 = 0;

    update(root);

    function update(source) {
        const genealogyData = treemap(root);

        // nodes
        var nodes = genealogyData.descendants();

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        nodes.forEach(d => {
            if (d.x < minX) minX = d.x;
            if (d.x > maxX) maxX = d.x;
            if (d.y < minY) minY = d.y;
            if (d.y > maxY) maxY = d.y;
        });

        const newHeight = maxY + margin.top + margin.bottom + 100; // Extra buffer
        const newWidth = maxX - minX + margin.left + margin.right + 100; // Extra buffer

        d3.select("#tree-svg")
            .transition().duration(duration)
            .attr("width", newWidth)
            .attr("height", newHeight);
        
        svg.transition().duration(duration)
            .attr("transform", `translate(${Math.abs(minX) + margin.left}, ${margin.top})`);

        nodes.forEach(function (d) {
            // Set y to a negative value for left-positioned nodes
            d.y = d.depth * 180 * (d.data.position === "left" ? -1 : 1);
        });

        var node = svg.selectAll("g.node").data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

        var nodeEnter = node
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + source.x0 + ", " + source.y0 + ")";
            })
            .on("click", click)
            .on("mouseover", function (event, d) {
                tooltip.style("opacity", 0.9);
                tooltip.html(
                    `<strong>${d.data.name}</strong><br/>` +
                    (d.data.age_when_father ? `Father at: ${d.data.age_when_father}<br/>` : "") +
                    (d.data.age_when_dead ? `Died at: ${d.data.age_when_dead}` : "")
                );
            })
            .on("mousemove", function (event, d) {
                tooltip
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 10 + "px");
            })
            .on("mouseout", function (event, d) {
                tooltip
                    .style("opacity", 0)
            })

        nodeEnter
            .append("circle")
            .attr("class", "node")
            .attr("r", 0)
            .style("fill", function (d) {
                return d._children ? "red" : "#fff";
            });

        nodeEnter
            .append("text")
            .attr("dy", "-1.5em")
            .attr("text-anchor", "middle")
            .text(function (d) {
                return d.data.name;
            })
            .style("fill", "black")            // The color of the text itself
            .style("stroke", "white")          // MUST match your background color
            .style("stroke-width", "8px")      // How much of the link to "erase"
            .style("stroke-linejoin", "round") // Makes the halo corners smooth
            .style("paint-order", "stroke");   // IMPORTANT: Draws the fat stroke *behind* the text

        var nodeUpdate = nodeEnter.merge(node);

        nodeUpdate
            .transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.x + ", " + d.y + ")";
            });

        nodeUpdate
            .select("circle.node")
            .attr("r", 10)
            .style("fill", function (d) {
                return d._children ? "red" : "#fff";
            })
            .attr("cursor", "pointer");

        var nodeExit = node
            .exit()
            .transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.x + "," + source.y + ")";
            })
            .remove();

        nodeExit.select("circle").attr("r", 0);
        nodeExit.select("text").style("fill-opacity", 0);

        // links
        function diagonal(s, d) {
            let path = `M ${s.x} ${s.y}
            C ${s.x} ${(s.y + d.y) / 2}
              ${d.x} ${(s.y + d.y) / 2}
              ${d.x} ${d.y}`;
            return path;
        }
        const links = genealogyData.descendants().slice(1);
        const link = svg.selectAll("path.link").data(links, function (d) {
            return d.id;
        });
        const linkEnter = link
            .enter()
            .insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
            let o = { x: source.x0, y: source.y };
                return diagonal(o, o);
            });
        const linkUpdate = linkEnter.merge(link);
        linkUpdate
            .transition()
            .duration(duration)
            .attr("d", function (d) {
            return diagonal(d, d.parent);
            });

        const linkExit = link
            .exit()
            .transition()
            .duration(duration)
            .attr("d", function (d) {
            let o = { x: source.x0, y: source.y0 };
                return diagonal(o, o);
            })
            .remove();

        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        function click(event, d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update(d);
        }
    }