import React, { useState, useEffect } from 'react';
import TreeChart from './TreeChart';
import { fetchEquityData } from '../services/api';
import './EquityPenetration.css';
import { Spin, Alert } from 'antd';

const EquityPenetration = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    // 处理窗口大小变化
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 异步加载数据
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const response = await fetchEquityData();

                if (response.success) {
                    setData(response.data);
                    setError(null);
                } else {
                    setError(response.error || '数据加载失败');
                }
            } catch (err) {
                setError('加载股权穿透数据时发生错误');
                console.error('数据加载错误:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // 渲染加载状态
    if (loading) {
        return (
            <div className="equity-penetration-container loading-container">
                <Spin tip="加载股权穿透数据..." size="large" />
            </div>
        );
    }

    // 渲染错误状态
    if (error) {
        return (
            <div className="equity-penetration-container error-container">
                <Alert
                    message="加载错误"
                    description={error}
                    type="error"
                    showIcon
                />
            </div>
        );
    }

    // 渲染图表
    return (
        <div className="equity-penetration-container" style={{ width: '100%', height: '100vh' }}>
            {data && <TreeChart data={data} />}
        </div>
    );
};

export default EquityPenetration; 