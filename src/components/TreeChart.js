import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import './TreeChart.css';
import { fetchCompanyChildren } from '../services/api';

const TreeChart = ({ data }) => {
    const svgRef = useRef();
    const containerRef = useRef();
    const [collapsedNodes, setCollapsedNodes] = useState(new Set());
    const currentTransformRef = useRef(null);
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
        hasChanged: false
    });
    const [loadingNodes, setLoadingNodes] = useState(new Set()); // 跟踪正在加载的节点
    const [loadedNodes, setLoadedNodes] = useState(new Set()); // 跟踪已经加载的节点
    const [treeData, setTreeData] = useState(data); // 存储完整的树数据

    // Define colors
    const blueColor = "#6495ED"; // Blue color for all borders and lines

    // 创建用于渲染的数据预处理函数
    const prepareTreeData = useCallback((rawData) => {
        // 递归处理每个节点
        const processNode = (node) => {
            // 确保每个节点都有hasChildren属性
            if (node.hasChildren === undefined) {
                // 如果未定义，则根据children数组判断
                node.hasChildren = Array.isArray(node.children) && node.children.length > 0;
            }

            // 处理子节点
            if (Array.isArray(node.children)) {
                node.children = node.children.map(child => processNode(child));
            } else {
                node.children = [];
            }

            return node;
        };

        // 处理整个树
        return processNode(JSON.parse(JSON.stringify(rawData)));
    }, []);

    // 更新树数据的useEffect
    useEffect(() => {
        if (data) {
            // 预处理数据，确保每个节点都有hasChildren属性
            const processedData = prepareTreeData(data);
            setTreeData(processedData);
        }
    }, [data, prepareTreeData]);

    // 更新树数据的函数
    const updateTreeData = useCallback((originalData, nodeId, children) => {
        // 递归函数，查找并更新指定ID的节点
        const updateNode = (node) => {
            if (node.id === nodeId) {
                // 找到节点，更新其子节点
                return { ...node, children };
            } else if (node.children) {
                // 递归处理子节点
                return {
                    ...node,
                    children: node.children.map(child => updateNode(child))
                };
            }
            // 未找到，返回原节点
            return node;
        };

        // 更新整个树
        return updateNode(originalData);
    }, []);

    // 异步加载子节点
    const loadChildrenAsync = useCallback(async (nodeId) => {
        if (loadingNodes.has(nodeId)) {
            return; // 避免重复加载
        }

        try {
            // 设置节点为加载状态
            setLoadingNodes(prev => new Set([...prev, nodeId]));

            // 调用API获取子节点
            const response = await fetchCompanyChildren(nodeId);

            if (response.success && response.data) {
                // 更新树数据
                setTreeData(prevData => updateTreeData(prevData, nodeId, response.data));

                // 标记节点已加载
                setLoadedNodes(prev => new Set([...prev, nodeId]));

                // 加载完成后展开节点，这样直接显示子节点
                setCollapsedNodes(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(nodeId); // 从折叠集合中移除，实现展开效果
                    return newSet;
                });
            }
        } catch (error) {
            console.error('加载子节点失败:', error);
        } finally {
            // 清除加载状态
            setLoadingNodes(prev => {
                const newSet = new Set(prev);
                newSet.delete(nodeId);
                return newSet;
            });
        }
    }, [loadingNodes, loadedNodes, updateTreeData]);

    // Function to toggle node collapse state
    const toggleNode = useCallback((d) => {
        // Store the current transform before toggling
        if (currentTransformRef.current) {
            const nodeId = d.data.id;

            const hasChildren = Array.isArray(d.data.children) && d.data.children.length > 0;

            // 如果没有子节点但hasChildren为true，触发异步加载
            if (!hasChildren && d.data.hasChildren === true) {
                loadChildrenAsync(nodeId);
                // 不需要在这里更改折叠状态，loadChildrenAsync函数会在加载完成后处理
            } else {
                // 有子节点，切换折叠状态
                setCollapsedNodes(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(nodeId)) {
                        newSet.delete(nodeId);
                    } else {
                        newSet.add(nodeId);
                    }
                    return newSet;
                });
            }
        }
    }, [loadChildrenAsync]);

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

    // Function to get tree dimensions
    const getTreeDimensions = useCallback((nodes) => {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        nodes.forEach(d => {
            minX = Math.min(minX, d.x - 60); // Account for node width (120/2)
            maxX = Math.max(maxX, d.x + 60); // Account for node width (120/2)
            minY = Math.min(minY, d.y - 30); // Account for node height (60/2)
            maxY = Math.max(maxY, d.y + 30); // Account for node height (60/2)
        });

        return {
            minX, maxX, minY, maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    }, []);

    // Function to calculate optimal transform
    const calculateOptimalTransform = useCallback((treeDimensions, containerWidth, containerHeight) => {
        const { minX, minY, width: treeWidth, height: treeHeight } = treeDimensions;

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
        return d3.zoomIdentity
            .scale(scale)
            .translate(offsetX, offsetY);
    }, []);

    // Effect for window resize
    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
                hasChanged: true
            });
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Main rendering effect
    useEffect(() => {
        if (!treeData || !svgRef.current) return;

        // Store the current transform for later use
        const previousTransform = currentTransformRef.current;

        // Clear any existing SVG content
        d3.select(svgRef.current).selectAll("*").remove();

        // Get the actual dimensions of the container
        const containerWidth = dimensions.width;
        const containerHeight = dimensions.height;

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
        const root = d3.hierarchy(treeData);

        // Define tree layout - vertical orientation
        const treeLayout = d3.tree()
            .nodeSize([150, 140]); // Horizontal and vertical spacing

        // Assign the data to the tree layout
        treeLayout(root);

        // Filter visible nodes and links
        const visibleNodes = root.descendants().filter(isVisible);
        const visibleLinks = root.links().filter(d => isVisible(d.source) && isVisible(d.target));

        // Calculate dimensions for centering
        const treeDimensions = getTreeDimensions(visibleNodes);

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
            .attr("fill", "#fff") // All rectangles are white now
            .attr("stroke", blueColor) // Blue border
            .attr("stroke-width", 1);

        // Add labels for each node with text wrapping
        node.append("text")
            .attr("text-anchor", "middle")
            .attr("font-size", 12)
            .attr("dy", "-0.3em") // Start a bit higher to accommodate multiple lines
            .attr("fill", "#333") // All text is dark gray
            .text(d => d.data.name)
            .call(wrapText, 110); // Apply text wrapping

        // 移除加载节点的旋转效果，使用静态图标
        node.filter(d => loadingNodes.has(d.data.id)).each(function (d) {
            const nodeGroup = d3.select(this);

            // 添加加载指示器背景，不使用旋转效果
            nodeGroup.append("circle")
                .attr("cx", 0)
                .attr("cy", 30) // Position at the bottom of the node
                .attr("r", 10)
                .attr("fill", "#f5f5f5")
                .attr("stroke", blueColor)
                .attr("stroke-width", 1);

            // 添加加载文本
            nodeGroup.append("text")
                .attr("x", 0)
                .attr("y", 30)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("font-size", 10)
                .attr("fill", blueColor)
                .attr("font-weight", "bold")
                .text("加载中");
        });

        // 添加展开/折叠图标
        node.filter(d => {
            // 节点标记为hasChildren=true，并且不在加载状态
            return d.data.hasChildren === true &&
                !loadingNodes.has(d.data.id);
        }).each(function (d) {
            const nodeGroup = d3.select(this);
            const nodeId = d.data.id;
            const hasChildren = Array.isArray(d.data.children) && d.data.children.length > 0;
            const isCollapsed = collapsedNodes.has(nodeId);

            // 确定显示的符号：
            // 如果有子节点且未折叠，显示减号(-)
            // 其他情况显示加号(+)
            const showMinusSign = hasChildren && !isCollapsed;

            // 添加展开/折叠图标背景
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
                    // 如果没有子节点但hasChildren为true，触发异步加载
                    if (!hasChildren && d.data.hasChildren === true) {
                        loadChildrenAsync(nodeId);
                        // 不需要在这里更改折叠状态，loadChildrenAsync函数会在加载完成后处理
                    } else {
                        // 有子节点，切换折叠状态
                        setCollapsedNodes(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(nodeId)) {
                                newSet.delete(nodeId);
                            } else {
                                newSet.add(nodeId);
                            }
                            return newSet;
                        });
                    }
                });

            // 添加加减号
            nodeGroup.append("text")
                .attr("x", 0)
                .attr("y", 30)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("font-size", 12)
                .attr("font-weight", "bold")
                .attr("fill", blueColor)
                .attr("cursor", "pointer")
                .text(showMinusSign ? "−" : "+") // 根据状态决定显示+或-
                .on("click", (event) => {
                    event.stopPropagation();
                    // 如果没有子节点但hasChildren为true，触发异步加载
                    if (!hasChildren && d.data.hasChildren === true) {
                        loadChildrenAsync(nodeId);
                        // 不需要在这里更改折叠状态，loadChildrenAsync函数会在加载完成后处理
                    } else {
                        // 有子节点，切换折叠状态
                        setCollapsedNodes(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(nodeId)) {
                                newSet.delete(nodeId);
                            } else {
                                newSet.add(nodeId);
                            }
                            return newSet;
                        });
                    }
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

        if (previousTransform && !dimensions.hasChanged) {
            // Use the previous transform if available and dimensions haven't changed
            initialTransform = previousTransform;
        } else {
            // Calculate new optimal transform
            initialTransform = calculateOptimalTransform(treeDimensions, containerWidth, containerHeight);

            // Reset the hasChanged flag after applying the new transform
            if (dimensions.hasChanged) {
                setDimensions(prev => ({ ...prev, hasChanged: false }));
            }
        }

        // Apply the transform
        svg.call(zoom.transform, initialTransform);

    }, [treeData, dimensions, collapsedNodes, isVisible, toggleNode, getTreeDimensions, calculateOptimalTransform, loadingNodes, prepareTreeData, blueColor]);

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

    // 添加节点加载指示器
    const renderLoadingIndicator = useCallback(() => {
        if (loadingNodes.size === 0) return null;

        return (
            <div className="loading-indicator">
                <div className="loading-status">
                    <span>正在加载 {loadingNodes.size} 个节点</span>
                </div>
            </div>
        );
    }, [loadingNodes.size]);

    return (
        <div ref={containerRef} className="tree-chart-container" style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
            {renderLoadingIndicator()}
        </div>
    );
};

export default TreeChart; 