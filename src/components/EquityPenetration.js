import React, { useState } from 'react';
import TreeChart from './TreeChart';
import { imageMatchData } from '../data/sampleData';

const EquityPenetration = () => {
    const [data] = useState(imageMatchData);

    return (
        <div className="equity-penetration-container">
            <TreeChart data={data} />
        </div>
    );
};

export default EquityPenetration; 