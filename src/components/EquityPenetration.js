import React, { useState } from 'react';
import TreeChart from './TreeChart';
import sampleData from '../data/sampleData';

const EquityPenetration = () => {
    const [data] = useState(sampleData);

    return (
        <div className="equity-penetration-container">
            <TreeChart data={data} />
        </div>
    );
};

export default EquityPenetration; 