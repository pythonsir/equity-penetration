import React, { useState, useEffect } from 'react';
import TreeChart from './TreeChart';
import { imageMatchData } from '../data/sampleData';
import './EquityPenetration.css';

const EquityPenetration = () => {
    const [data] = useState(imageMatchData);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

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

    return (
        <div className="equity-penetration-container" style={{ width: '100%', height: '100vh' }}>
            <TreeChart data={data} />
        </div>
    );
};

export default EquityPenetration; 