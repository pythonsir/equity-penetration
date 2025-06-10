// Sample data for equity penetration visualization
const sampleData = {
    name: "山东映客科技有限责任公司",
    id: "company-main",
    value: 100,
    children: [
        {
            name: "山东第一有限罗技科服务有限公司",
            id: "company-1",
            value: 100,
            percentage: 100,
            children: []
        },
        {
            name: "山东第二有限罗技科技有限公司",
            id: "company-2",
            value: 100,
            percentage: 100,
            children: []
        },
        {
            name: "山东第三有限罗技软件科技有限公司",
            id: "company-3",
            value: 100,
            percentage: 100,
            children: []
        },
        {
            name: "山东第四有限罗技科技发展有限公司",
            id: "company-4",
            value: 100,
            percentage: 100,
            children: [
                {
                    name: "山东第一达科技物联网分析仪器有限公司",
                    id: "company-4-1",
                    value: 100,
                    percentage: 100,
                    children: [
                        {
                            name: "山东电科技子公司一",
                            id: "company-4-1-1",
                            value: 50,
                            percentage: 50,
                            children: []
                        },
                        {
                            name: "山东电科技子公司二",
                            id: "company-4-1-2",
                            value: 90,
                            percentage: 90,
                            children: []
                        },
                        {
                            name: "山东电科技子公司三",
                            id: "company-4-1-3",
                            value: 100,
                            percentage: 100,
                            children: []
                        }
                    ]
                }
            ]
        },
        {
            name: "山东第五有限罗技电工科技有限公司",
            id: "company-5",
            value: 100,
            percentage: 100,
            children: [
                {
                    name: "山东第二达科技低压自动化设备有限公司",
                    id: "company-5-1",
                    value: 100,
                    percentage: 100,
                    children: [
                        {
                            name: "山东数业电子公司一",
                            id: "company-5-1-1",
                            value: 100,
                            percentage: 100,
                            children: []
                        },
                        {
                            name: "山东数业电子公司二",
                            id: "company-5-1-2",
                            value: 90,
                            percentage: 90,
                            children: []
                        }
                    ]
                }
            ]
        },
        {
            name: "山东第六有限罗罗学分析仪器(集团)有限责任公司",
            id: "company-6",
            value: 100,
            percentage: 100,
            children: [
                {
                    name: "山东第三达科技分析仪器工业有限公司",
                    id: "company-6-1",
                    value: 100,
                    percentage: 100,
                    children: []
                }
            ]
        }
    ]
};

// Add parent company structure
const fullData = {
    name: "山东罗罗丁子集团有限公司",
    id: "parent-company",
    value: 100,
    children: [
        {
            name: "山东制停科技集团有限责任公司",
            id: "intermediate-company",
            value: 100,
            percentage: 100,
            children: [
                {
                    name: "山东制停科技有限责任公司",
                    id: "direct-parent",
                    value: 60,
                    percentage: 60,
                    children: [sampleData]
                }
            ]
        },
        {
            name: "吴小宝",
            id: "individual-shareholder",
            value: 40,
            percentage: 40,
            children: []
        }
    ]
};

// Create the exact structure from the image
const imageMatchData = {
    name: "山东罗罗丁子集团有限公司",
    id: "parent-company",
    value: 100,
    children: [
        {
            name: "山东制停科科技集团有限责任公司",
            id: "intermediate-company",
            value: 100,
            percentage: 100,
            children: [
                {
                    name: "山东映客科技有限责任公司",
                    id: "main-company",
                    value: 100,
                    percentage: 60,
                    children: [
                        {
                            name: "山东第一有限罗技科服务有限公司",
                            id: "company-1",
                            value: 100,
                            percentage: 100,
                            children: []
                        },
                        {
                            name: "山东第二有限罗技科技有限公司",
                            id: "company-2",
                            value: 100,
                            percentage: 100,
                            children: []
                        },
                        {
                            name: "山东第三有限罗技软件科技有限公司",
                            id: "company-3",
                            value: 100,
                            percentage: 100,
                            children: []
                        },
                        {
                            name: "山东第四有限罗技科技发展有限公司",
                            id: "company-4",
                            value: 100,
                            percentage: 100,
                            children: [
                                {
                                    name: "山东第一达科技物联网分析仪器有限公司",
                                    id: "company-4-1",
                                    value: 100,
                                    percentage: 100,
                                    children: [
                                        {
                                            name: "山东电科技子公司一",
                                            id: "company-4-1-1",
                                            value: 50,
                                            percentage: 50,
                                            children: []
                                        },
                                        {
                                            name: "山东电科技子公司二",
                                            id: "company-4-1-2",
                                            value: 90,
                                            percentage: 90,
                                            children: []
                                        },
                                        {
                                            name: "山东电科技子公司三",
                                            id: "company-4-1-3",
                                            value: 100,
                                            percentage: 100,
                                            children: []
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            name: "山东第五有限罗技电工科技有限公司",
                            id: "company-5",
                            value: 100,
                            percentage: 100,
                            children: [
                                {
                                    name: "山东第二达科技低压自动化设备有限公司",
                                    id: "company-5-1",
                                    value: 100,
                                    percentage: 100,
                                    children: [
                                        {
                                            name: "山东数业电子公司一",
                                            id: "company-5-1-1",
                                            value: 100,
                                            percentage: 100,
                                            children: []
                                        },
                                        {
                                            name: "山东数业电子公司二",
                                            id: "company-5-1-2",
                                            value: 90,
                                            percentage: 90,
                                            children: []
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            name: "山东第六有限罗罗学分析仪器(集团)有限责任公司",
                            id: "company-6",
                            value: 100,
                            percentage: 100,
                            children: [
                                {
                                    name: "山东第三达科技分析仪器工业有限公司",
                                    id: "company-6-1",
                                    value: 100,
                                    percentage: 100,
                                    children: []
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            name: "吴小宝",
            id: "individual-shareholder",
            value: 40,
            percentage: 40,
            children: []
        }
    ]
};

// Export all data structures
export { sampleData, fullData, imageMatchData };
export default imageMatchData; 