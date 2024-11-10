'use client';

import React from 'react';
import 'reactflow/dist/style.css';
import ContractExecution from './ContractExecution';

interface FlowGraphProps {
  nodes: any[];
  edges: any[];
  flowSummary: any[];
  contractCalls?: Array<{
    name: string;
    params: Array<{
      name: string;
      type: string;
    }>;
  }>;
}

const FlowGraph: React.FC<FlowGraphProps> = ({ nodes, edges, flowSummary = [], contractCalls = [] }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="mt-4">
        {flowSummary && flowSummary.length > 0 ? (
          <ol className="list-decimal pl-5">
            {flowSummary.map((item, index) => (
              <li key={index} className="mb-2 text-[#B2B2B2]">
                {item.content}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[#B2B2B2]">No flow summary available.</p>
        )}
      </div>
      
      <ContractExecution contractCalls={contractCalls} />
    </div>
  );
};

export default FlowGraph;
