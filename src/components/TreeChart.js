import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const TreeChart = ({ data }) => {
    const svgRef = useRef();

    // Define colors
    const blueColor = "#6495ED"; // Blue color for all borders and lines

    // Function to wrap text with truncation
    const wrapText = (text, width) => {
        text.each(function () {
            const text = d3.select(this);
            const words = text.text().split('').reverse();
            const lineHeight = 1.4; // Increased line height for better spacing
            const y = text.attr("y");
            const dy = parseFloat(text.attr("dy"));

            let line = [];
            let lineNumber = 0;
            let tspan = text.text(null)
                .append("tspan")
                .attr("x", 0)
                .attr("y", y)
                .attr("dy", dy + "em");

            let word;
            let lineLength = 0;
            const maxCharsPerLine = Math.floor(width / 12); // Approximate chars per line
            const maxLines = 2; // Maximum number of lines before truncating

            while (words.length && lineNumber < maxLines) {
                word = words.pop();
                line.push(word);
                lineLength++;

                if (lineLength >= maxCharsPerLine) {
                    // If this is the last allowed line and there are more words
                    if (lineNumber === maxLines - 1 && words.length > 0) {
                        // Add ellipsis to indicate truncation
                        tspan.text(line.join("").slice(0, -2) + "...");
                        break;
                    } else {
                        tspan.text(line.join(""));
                        line = [];
                        lineLength = 0;
                        lineNumber++;

                        // Only create a new tspan if we're not at max lines
                        if (lineNumber < maxLines) {
                            tspan = text.append("tspan")
                                .attr("x", 0)
                                .attr("y", y)
                                .attr("dy", lineNumber * lineHeight + dy + "em");
                        }
                    }
                }
            }

            // Handle remaining text
            if (line.length > 0 && lineNumber < maxLines) {
                // If this is the last allowed line and there are more words
                if (lineNumber === maxLines - 1 && words.length > 0) {
                    tspan.text(line.join("").slice(0, -2) + "...");
                } else {
                    tspan.text(line.join(""));
                }
            }
        });
    };

    useEffect(() => {
        if (!data || !svgRef.current) return;

        // Clear any existing SVG content
        d3.select(svgRef.current).selectAll("*").remove();

        // Get the actual dimensions of the container
        const containerWidth = svgRef.current.clientWidth || window.innerWidth;
        const containerHeight = svgRef.current.clientHeight || window.innerHeight;

        // Create the SVG container
        const svg = d3.select(svgRef.current)
            .attr("width", containerWidth)
            .attr("height", containerHeight);

        // Define arrowhead marker
        svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10)
            .attr("refY", 0)
            .attr("orient", "auto")
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("xoverflow", "visible")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", blueColor) // Blue arrow
            .style("stroke", "none");

        // Create a group for the tree with initial transform
        const g = svg.append("g");

        // Create the hierarchical data structure
        const root = d3.hierarchy(data);

        // Count max nodes at any level for better spacing
        const countNodesByLevel = {};
        root.each(d => {
            if (!countNodesByLevel[d.depth]) {
                countNodesByLevel[d.depth] = 0;
            }
            countNodesByLevel[d.depth]++;
        });

        const maxNodesAtLevel = Math.max(...Object.values(countNodesByLevel));
        const horizontalSpacing = Math.max(150, containerWidth / (maxNodesAtLevel + 1));

        // Define tree layout - vertical orientation
        const treeLayout = d3.tree()
            .nodeSize([horizontalSpacing, 140]); // Increase vertical spacing for text wrapping

        // Assign the data to the tree layout
        treeLayout(root);

        // Center the tree horizontally
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        root.each(d => {
            minX = Math.min(minX, d.x);
            maxX = Math.max(maxX, d.x);
            minY = Math.min(minY, d.y);
            maxY = Math.max(maxY, d.y);
        });

        const centerX = (containerWidth - (maxX - minX)) / 2 - minX;
        const centerY = 50; // Add some padding at the top

        // Add links between nodes
        const links = g.selectAll(".link")
            .data(root.links())
            .enter()
            .append("g")
            .attr("class", "link");

        // Create paths for links with segments
        links.each(function (d) {
            const link = d3.select(this);
            const sourceX = d.source.x + centerX;
            const sourceY = d.source.y + centerY;
            const targetX = d.target.x + centerX;
            const targetY = d.target.y + centerY;
            const midY = (sourceY + targetY) / 2;

            // Vertical line from source
            link.append("path")
                .attr("fill", "none")
                .attr("stroke", blueColor) // Blue line
                .attr("stroke-width", 1)
                .attr("d", `M${sourceX},${sourceY} L${sourceX},${midY}`);

            // Horizontal line
            link.append("path")
                .attr("fill", "none")
                .attr("stroke", blueColor) // Blue line
                .attr("stroke-width", 1)
                .attr("d", `M${sourceX},${midY} L${targetX},${midY}`);

            // Vertical line to target with arrow
            link.append("path")
                .attr("fill", "none")
                .attr("stroke", blueColor) // Blue line
                .attr("stroke-width", 1)
                .attr("marker-end", "url(#arrowhead)")
                .attr("d", `M${targetX},${midY} L${targetX},${targetY - 30}`); // Stop before the node for arrow

            // Add percentage label to the side of the vertical line with arrow if available
            if (d.target.data.percentage) {
                // Position the label to the right of the vertical line
                const labelX = targetX + 15; // 15px to the right of the line

                // Add percentage text with white background
                link.append("text")
                    .attr("x", labelX)
                    .attr("y", (midY + targetY - 30) / 2)
                    .attr("text-anchor", "start")
                    .attr("dominant-baseline", "central")
                    .attr("font-size", 11)
                    .attr("font-weight", "bold")
                    .attr("fill", "#000") // Pure black text
                    .attr("stroke", "white") // White outline for better visibility
                    .attr("stroke-width", 0.5)
                    .attr("paint-order", "stroke") // Draw stroke behind text
                    .text(`${d.target.data.percentage}%`);
            }
        });

        // Create a group for each node
        const node = g.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
            .attr("transform", d => `translate(${d.x + centerX},${d.y + centerY})`);

        // Add rectangles for each node
        node.append("rect")
            .attr("width", 120)
            .attr("height", 60) // Increased height for better text spacing
            .attr("x", -60)
            .attr("y", -30)
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("fill", d => {
                // Highlight the main company in blue
                if (d.data.name === "山东映客科技有限责任公司") {
                    return blueColor;
                }
                return "#fff";
            })
            .attr("stroke", blueColor) // Blue border
            .attr("stroke-width", 1);

        // Add labels for each node with text wrapping
        node.append("text")
            .attr("text-anchor", "middle")
            .attr("font-size", 12)
            .attr("dy", "-0.3em") // Start a bit higher to accommodate multiple lines
            .attr("fill", d => {
                if (d.data.name === "山东映客科技有限责任公司") {
                    return "#fff";
                }
                return "#333";
            })
            .text(d => d.data.name)
            .call(wrapText, 110); // Apply text wrapping

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.2, 3]) // Allow more zoom range
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Initial zoom to fit the tree
        const treeWidth = maxX - minX + 240; // Add some padding
        const treeHeight = maxY - minY + 100;

        const scale = Math.min(
            containerWidth / treeWidth,
            containerHeight / treeHeight,
            1 // Cap at 1 to avoid making it too large
        ) * 0.9; // Slightly smaller to ensure it fits

        const initialTransform = d3.zoomIdentity
            .translate(containerWidth / 2, containerHeight / 4)
            .scale(scale)
            .translate(-treeWidth / 2, 0);

        svg.call(zoom.transform, initialTransform);

        // Add resize handler
        const handleResize = () => {
            const newWidth = svgRef.current.clientWidth || window.innerWidth;
            const newHeight = svgRef.current.clientHeight || window.innerHeight;

            svg.attr("width", newWidth)
                .attr("height", newHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };

    }, [data]);

    return (
        <div className="tree-chart-container">
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default TreeChart; 