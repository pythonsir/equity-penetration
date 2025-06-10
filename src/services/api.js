import { imageMatchData } from '../data/sampleData';
import {
    company1Children,
    company1BChildren,
    company3Children,
    company3CChildren,
    company411Children,
    company511Children,
    company61Children
} from '../data/asyncData';

// 模拟API延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 获取股权穿透数据
export const fetchEquityData = async () => {
    try {
        // 模拟网络请求延迟
        await delay(800);

        // 返回股权数据
        return {
            success: true,
            data: imageMatchData
        };
    } catch (error) {
        console.error('加载股权穿透数据出错:', error);
        return {
            success: false,
            error: '数据加载失败'
        };
    }
};

// 根据公司ID获取子公司数据
export const fetchCompanyChildren = async (companyId) => {
    try {
        // 模拟网络请求延迟 - 不同节点延迟不同，更真实
        const delayTime = Math.floor(Math.random() * 600) + 600; // 600-1200ms的随机延迟
        await delay(delayTime);

        // 根据公司ID返回相应的子公司数据
        let children = [];

        switch (companyId) {
            case 'company-1':
                children = company1Children;
                break;
            case 'company-1-b':
                children = company1BChildren;
                break;
            case 'company-3':
                children = company3Children;
                break;
            case 'company-3-c':
                children = company3CChildren;
                break;
            case 'company-4-1-1':
                children = company411Children;
                break;
            case 'company-5-1-1':
                children = company511Children;
                break;
            case 'company-6-1':
                children = company61Children;
                break;
            default:
                // 如果没有匹配的ID，返回空数组但仍然成功
                children = [];
        }

        // 返回找到的子公司数据
        return {
            success: true,
            data: children
        };
    } catch (error) {
        console.error('加载子公司数据出错:', error);
        return {
            success: false,
            error: '子公司数据加载失败'
        };
    }
}; 