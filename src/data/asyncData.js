// 异步加载的子公司数据

// 公司1的子公司数据
const company1Children = [
    {
        name: "山东第一子公司A",
        id: "company-1-a",
        value: 75,
        percentage: 75,
        hasChildren: false,
        children: []
    },
    {
        name: "山东第一子公司B",
        id: "company-1-b",
        value: 60,
        percentage: 60,
        hasChildren: true,
        children: []
    }
];

// 公司1-B的子公司数据
const company1BChildren = [
    {
        name: "山东一级孙公司X",
        id: "company-1-b-x",
        value: 100,
        percentage: 100,
        hasChildren: false,
        children: []
    }
];

// 公司3的子公司数据
const company3Children = [
    {
        name: "山东软件科技分公司A",
        id: "company-3-a",
        value: 80,
        percentage: 80,
        hasChildren: false,
        children: []
    },
    {
        name: "山东软件科技分公司B",
        id: "company-3-b",
        value: 100,
        percentage: 100,
        hasChildren: false,
        children: []
    },
    {
        name: "山东软件科技分公司C",
        id: "company-3-c",
        value: 51,
        percentage: 51,
        hasChildren: true,
        children: []
    }
];

// 公司3-C的子公司数据
const company3CChildren = [
    {
        name: "山东软件开发部门",
        id: "company-3-c-1",
        value: 100,
        percentage: 100,
        hasChildren: false,
        children: []
    },
    {
        name: "山东数据分析部门",
        id: "company-3-c-2",
        value: 100,
        percentage: 100,
        hasChildren: false,
        children: []
    }
];

// 公司4-1-1的子公司数据
const company411Children = [
    {
        name: "山东科技测量仪器有限公司",
        id: "company-4-1-1-a",
        value: 65,
        percentage: 65,
        hasChildren: false,
        children: []
    },
    {
        name: "山东科技传感器有限公司",
        id: "company-4-1-1-b",
        value: 70,
        percentage: 70,
        hasChildren: false,
        children: []
    }
];

// 公司5-1-1的子公司数据
const company511Children = [
    {
        name: "山东数业电子芯片分公司",
        id: "company-5-1-1-a",
        value: 60,
        percentage: 60,
        hasChildren: false,
        children: []
    },
    {
        name: "山东数业电子元件分公司",
        id: "company-5-1-1-b",
        value: 100,
        percentage: 100,
        hasChildren: false,
        children: []
    }
];

// 公司6-1的子公司数据
const company61Children = [
    {
        name: "山东第三达仪器销售有限公司",
        id: "company-6-1-a",
        value: 85,
        percentage: 85,
        hasChildren: false,
        children: []
    },
    {
        name: "山东第三达仪器研发中心",
        id: "company-6-1-b",
        value: 100,
        percentage: 100,
        hasChildren: false,
        children: []
    },
    {
        name: "山东第三达仪器生产基地",
        id: "company-6-1-c",
        value: 100,
        percentage: 100,
        hasChildren: false,
        children: []
    }
];

// 导出所有异步数据
export {
    company1Children,
    company1BChildren,
    company3Children,
    company3CChildren,
    company411Children,
    company511Children,
    company61Children
}; 