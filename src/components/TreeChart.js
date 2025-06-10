import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { PlusCircleFilled, MinusCircleFilled } from '@ant-design/icons';
import * as ReactDOM from 'react-dom/client';

const TreeChart = ({ data }) => {
    const svgRef = useRef();
    const [collapsedNodes, setCollapsedNodes] = useState(new Set());
    const [iconContainers, setIconContainers] = useState({});
    const rootsRef = useRef(new Map());
    const zoomRef = useRef(null);
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

    // Clean up function for removing icons
    const cleanupIcons = useCallback(() => {
        // Unmount all roots and remove containers
        rootsRef.current.forEach((root, nodeId) => {
            try {
                if (root) {
                    root.unmount();
                }
            } catch (e) {
                console.warn('Error unmounting root:', e);
            }

            const container = iconContainers[nodeId];
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });

        // Clear the roots map
        rootsRef.current.clear();
        setIconContainers({});
    }, [iconContainers]);

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
            minX = Math.min(minX, d.x);
            maxX = Math.max(maxX, d.x);
            minY = Math.min(minY, d.y);
            maxY = Math.max(maxY, d.y);
        });

        const centerX = (containerWidth - (maxX - minX)) / 2 - minX;
        const centerY = 50; // Add some padding at the top

        // Add links between nodes
        const links = g.selectAll(".link")
            .data(visibleLinks)
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
            .data(visibleNodes)
            .enter()
            .append("g")
            .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
            .attr("transform", d => `translate(${d.x + centerX},${d.y + centerY})`)
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

        // Add icon containers for nodes with children at the bottom center of the node
        const newIconContainers = {};

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

        // Update the icon containers state
        setIconContainers(newIconContainers);

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.2, 3]) // Allow more zoom range
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                // Store the current transform for later use
                currentTransformRef.current = event.transform;
            });

        // Store zoom reference
        zoomRef.current = zoom;

        svg.call(zoom);

        // Set initial transform - either restore previous or calculate new one
        let initialTransform;

        if (previousTransform) {
            // Use the previous transform if available
            initialTransform = previousTransform;
        } else {
            // Calculate initial transform to fit the tree
            const treeWidth = maxX - minX + 240; // Add some padding
            const treeHeight = maxY - minY + 100;

            const scale = Math.min(
                containerWidth / treeWidth,
                containerHeight / treeHeight,
                1 // Cap at 1 to avoid making it too large
            ) * 0.9; // Slightly smaller to ensure it fits

            initialTransform = d3.zoomIdentity
                .translate(containerWidth / 2, containerHeight / 4)
                .scale(scale)
                .translate(-treeWidth / 2, 0);
        }

        // Apply the transform
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

    }, [data, collapsedNodes, isVisible, toggleNode, blueColor]);

    return (
        <div className="tree-chart-container" style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default TreeChart; 