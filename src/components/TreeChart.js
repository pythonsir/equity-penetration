import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

const TreeChart = ({ data }) => {
    const svgRef = useRef();
    const containerRef = useRef();
    const [collapsedNodes, setCollapsedNodes] = useState(new Set());
    const currentTransformRef = useRef(null);

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

    // Function to toggle node collapse state
    const toggleNode = useCallback((d) => {
        // Store the current transform before toggling
        if (currentTransformRef.current) {
            // Toggle the node's collapse state
            setCollapsedNodes(prev => {
                const nodeId = d.data.id;
                const newSet = new Set(prev);
                if (newSet.has(nodeId)) {
                    newSet.delete(nodeId);
                } else {
                    newSet.add(nodeId);
                }
                return newSet;
            });
        }
    }, []);

    // Function to check if a node should be visible
    const isVisible = useCallback((d) => {
        // Root is always visible
        if (d.depth === 0) return true;

        // If any ancestor is collapsed, this node is not visible
        let ancestor = d.parent;
        while (ancestor) {
            if (collapsedNodes.has(ancestor.data.id)) {
                return false;
            }
            ancestor = ancestor.parent;
        }

        return true;
    }, [collapsedNodes]);

    // Main rendering effect
    useEffect(() => {
        if (!data || !svgRef.current) return;

        // Store the current transform for later use
        const previousTransform = currentTransformRef.current;

        // Clear any existing SVG content
        d3.select(svgRef.current).selectAll("*").remove();

        // Get the actual dimensions of the container
        const containerWidth = svgRef.current.clientWidth || window.innerWidth;
        const containerHeight = svgRef.current.clientHeight || window.innerHeight;

        // Create the SVG container with full width and height
        const svg = d3.select(svgRef.current)
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", [0, 0, containerWidth, containerHeight].join(' '));

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

        // Define tree layout - vertical orientation
        const treeLayout = d3.tree()
            .nodeSize([150, 140]); // Horizontal and vertical spacing

        // Assign the data to the tree layout
        treeLayout(root);

        // Filter visible nodes and links
        const visibleNodes = root.descendants().filter(isVisible);
        const visibleLinks = root.links().filter(d => isVisible(d.source) && isVisible(d.target));

        // Calculate dimensions for centering
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        visibleNodes.forEach(d => {
            minX = Math.min(minX, d.x - 60); // Account for node width (120/2)
            maxX = Math.max(maxX, d.x + 60); // Account for node width (120/2)
            minY = Math.min(minY, d.y - 30); // Account for node height (60/2)
            maxY = Math.max(maxY, d.y + 30); // Account for node height (60/2)
        });

        // Calculate the width and height of the tree
        const treeWidth = maxX - minX;
        const treeHeight = maxY - minY;

        // Add links between nodes
        const links = g.selectAll(".link")
            .data(visibleLinks)
            .enter()
            .append("g")
            .attr("class", "link");

        // Create paths for links with segments
        links.each(function (d) {
            const link = d3.select(this);
            const sourceX = d.source.x;
            const sourceY = d.source.y;
            const targetX = d.target.x;
            const targetY = d.target.y;
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
            .data(visibleNodes)
            .enter()
            .append("g")
            .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .style("cursor", d => d.data.children && d.data.children.length > 0 ? "pointer" : "default"); // Change cursor for parent nodes

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

        // Add SVG icons directly in the D3 visualization
        node.filter(d => d.data.children && d.data.children.length > 0).each(function (d) {
            const nodeGroup = d3.select(this);
            const isCollapsed = collapsedNodes.has(d.data.id);

            // Add a circle for the icon background
            nodeGroup.append("circle")
                .attr("cx", 0)
                .attr("cy", 30) // Position at the bottom of the node
                .attr("r", 8)
                .attr("fill", "white")
                .attr("stroke", blueColor)
                .attr("stroke-width", 1)
                .attr("cursor", "pointer")
                .on("click", (event) => {
                    event.stopPropagation();
                    toggleNode(d);
                });

            // Add the plus or minus symbol
            nodeGroup.append("text")
                .attr("x", 0)
                .attr("y", 30)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("font-size", 12)
                .attr("font-weight", "bold")
                .attr("fill", blueColor)
                .attr("cursor", "pointer")
                .text(isCollapsed ? "+" : "−") // Plus for collapsed, minus for expanded
                .on("click", (event) => {
                    event.stopPropagation();
                    toggleNode(d);
                });
        });

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.2, 3]) // Allow more zoom range
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                // Store the current transform for later use
                currentTransformRef.current = event.transform;
            });

        svg.call(zoom);

        // Set initial transform - either restore previous or calculate new one
        let initialTransform;

        if (previousTransform) {
            // Use the previous transform if available
            initialTransform = previousTransform;
        } else {
            // Calculate padding (as a percentage of container size)
            const paddingX = containerWidth * 0.1;
            const paddingY = containerHeight * 0.1;

            // Calculate the scale to fit the tree in the viewport with padding
            const scaleX = (containerWidth - paddingX * 2) / treeWidth;
            const scaleY = (containerHeight - paddingY * 2) / treeHeight;
            const scale = Math.min(scaleX, scaleY, 1) * 0.9; // Slightly smaller to ensure it fits

            // Calculate offsets to center the tree
            const offsetX = (containerWidth / scale - treeWidth) / 2 - minX;
            const offsetY = (containerHeight / scale - treeHeight) / 2 - minY;

            // Create the transform
            initialTransform = d3.zoomIdentity
                .scale(scale)
                .translate(offsetX, offsetY);
        }

        // Apply the transform
        svg.call(zoom.transform, initialTransform);

        // Add resize handler
        const handleResize = () => {
            if (!svgRef.current) return;

            const newWidth = svgRef.current.clientWidth || window.innerWidth;
            const newHeight = svgRef.current.clientHeight || window.innerHeight;

            // Update viewBox for responsiveness
            svg.attr("viewBox", [0, 0, newWidth, newHeight].join(' '));

            // If no custom transform is set, recalculate the transform
            if (!currentTransformRef.current) {
                // Calculate padding (as a percentage of container size)
                const paddingX = newWidth * 0.1;
                const paddingY = newHeight * 0.1;

                // Calculate the scale to fit the tree in the viewport with padding
                const scaleX = (newWidth - paddingX * 2) / treeWidth;
                const scaleY = (newHeight - paddingY * 2) / treeHeight;
                const scale = Math.min(scaleX, scaleY, 1) * 0.9;

                // Calculate offsets to center the tree
                const offsetX = (newWidth / scale - treeWidth) / 2 - minX;
                const offsetY = (newHeight / scale - treeHeight) / 2 - minY;

                // Create and apply the transform
                const resizeTransform = d3.zoomIdentity
                    .scale(scale)
                    .translate(offsetX, offsetY);

                svg.call(zoom.transform, resizeTransform);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };

    }, [data, collapsedNodes, isVisible, toggleNode, blueColor]);

    return (
        <div ref={containerRef} className="tree-chart-container" style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
        </div>
    );
};

export default TreeChart; 