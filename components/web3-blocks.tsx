"use client"

// React and Next.js imports
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// UI components and utilities
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"


// Third-party libraries
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "framer-motion"
import {
  Wallet,
  ArrowRightLeft,
  Repeat,
  MessageSquare,
  DollarSign,
  Power,
  ChevronRight,
  ChevronLeft,
  Plus,
  Info,
  Code,
  Landmark,
  Droplets,
  HandCoins,
  Fan,
  Sprout,
  Tractor,
  BarChart3,
  Clock,
  Package,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Coins,
  Banknote,
  Users,
  Zap,
  Briefcase,
  LockKeyhole,
  Gift,
  History,
  ChartLine,
  Plane,
  Flag,
  Loader2,
} from 'lucide-react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  useStore,
  NodeToolbar,
  Position,
  reconnectEdge,
  getOutgoers,
  useReactFlow,
  ReactFlowProvider,
  BaseEdge,
  NodeProps,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { toast } from 'sonner'
import CustomBlockModal from './CustomBlockModal'
import SwapNode from './SwapNode'
import StakeNode from './StakeNode'
import AllocateNode from './AllocateNode'
import CompilationModal from './CompilationModal'
import { DragHandleDots2Icon } from "@radix-ui/react-icons";

// Define the different block types with their properties
const blockTypes = [
  // Trigger Actions
  { id: 'start', content: 'Start Block', color: 'bg-[#451805]', borderColor: 'border-[#8A5035]', hoverBorderColor: 'hover:border-[#BE5B2A]', icon: Flag },
  { id: 'end', content: 'End Block', color: 'bg-[#451805]', borderColor: 'border-[#8A5035]', hoverBorderColor: 'hover:border-[#BE5B2A]', icon: Power },

  // Token Actions
  { id: 'swap', content: 'Swap Tokens', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: ArrowRightLeft },
  { id: 'stake', content: 'Stake Tokens', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: Landmark },
  { id: 'allocate', content: 'Allocate Tokens', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: HandCoins },
  { id: 'lendTokens', content: 'Lend Tokens', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: PiggyBank },
  { id: 'borrowTokens', content: 'Borrow Tokens', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: Coins },
  { id: 'claimTokens', content: 'Claim Tokens', color: 'bg-[#142321]', borderColor: 'border-[#245C3D]', hoverBorderColor: 'hover:border-[#6AFB8E]', icon: Gift },

  ]

// Group blocks into categories for the sidebar
const groupedBlocks = {
  "Trigger Actions": blockTypes.filter(block => ['start', 'end', 'disconnect', 'initialise'].includes(block.id)),
  "Token Actions": blockTypes.filter(block => ['swap', 'stake', 'allocate', 'startYieldFarming', 'stopYieldFarming', 'lendTokens', 'borrowTokens', 'repayLoan', 'claimTokens'].includes(block.id)),
  "Custom": blockTypes.filter(block => ['custom'].includes(block.id)),
}

// Form validation schema using Zod
const formSchema = z.object({
  blockName: z.string().min(1, "Block name is required"),
  solidityCode: z.string().min(1, "Solidity code is required"),
})

// Define BlockNode component outside of Web3BlocksComponent
const BlockNode = ({ data, isDragging, id }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const isSelected = id === selectedNode;
  if (data.id === 'swap') {
    return <SwapNode data={data} isConnectable={true} id={''} selected={false} type={''} zIndex={0} xPos={0} yPos={0} dragging={false} />;
  }
  if (data.id === 'stake') {
    return <StakeNode data={data} isConnectable={true} type={''} id={''} selected={false} zIndex={0} xPos={0} yPos={0} dragging={false} />;
  }
  if (data.id === 'allocate') {
    return <AllocateNode data={data} isConnectable={true} selected={false} type={''} zIndex={0} xPos={0} yPos={0} dragging={false} />;
  }
  
  return (
    <div
      className={`
        ${data.color} text-white p-4 rounded-lg cursor-pointer select-none
        flex items-center justify-between border transition-all duration-300 w-[160px]
        ${isDragging ? 'opacity-70' : ''}
        ${isSelected ? 'border-white shadow-[0_0_25px_rgba(251,17,142,0.35)]' : data.borderColor} 
        ${isSelected ? '' : data.hoverBorderColor} 
        relative
        shadow-[0_0_15px_rgba(251,17,142,0.15)]
        hover:shadow-[0_0_20px_rgba(251,17,142,0.25)]
        transform hover:-translate-y-0.5
      `}
    >
      {id !== 'start' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Handle 
            type="target" 
            position={Position.Top} 
            className="w-3 h-3 bg-[#FB118E] border-2 border-[#FB118E] hover:w-4 hover:h-4 hover:bg-white transition-all duration-300" 
          />
        </div>
      )}
      <span className="text-sm">{data.content}</span>
      <data.icon className="w-4 h-4" />
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="w-3 h-3 bg-[#FB118E] border-2 border-[#FB118E] hover:w-4 hover:h-4 hover:bg-white transition-all duration-300" 
        />
      </div>
    </div>
  );
};

// Define nodeTypes outside of the component
const nodeTypes = {
  blockNode: BlockNode,
  swapNode: SwapNode,
  stakeNode: StakeNode,
}

// Main component for the DeFi Blocks builder
function Web3BlocksComponent() {
  // State variables
  const [showFinishButton, setShowFinishButton] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [isCredenzaOpen, setIsCredenzaOpen] = useState(false)
  const [tutorialMode, setTutorialMode] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [flowSummary, setFlowSummary] = useState([])
  const router = useRouter()
  const [showClearButton, setShowClearButton] = useState(false)
  const edgeReconnectSuccessful = useRef(true)
  const [selectedNode, setSelectedNode] = useState(null)
  const [isCompiling, setIsCompiling] = useState(false)
  const [showCompilationModal, setShowCompilationModal] = useState(false)

  // Initialize the form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      blockName: "",
      solidityCode: "",
    },
  })

  // Function to delete a node and its associated edges
  const handleDeleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    setFlowSummary((prevSummary) => prevSummary.filter((item) => item.id !== nodeId))
    toast.success('Block deleted')
  }

  // Function to add a new node connected to a source node
  const handleAddNode = (sourceNodeId, block) => {
    const newNodeId = Date.now().toString()
    const sourceNode = nodes.find(node => node.id === sourceNodeId)
    const newNode = {
      id: newNodeId,
      type: 'blockNode',
      position: { x: sourceNode.position.x, y: sourceNode.position.y + 150 },
      data: {
        ...block,
        onNodeClick: handleNodeClick,
        uniqueId: newNodeId,
        handleDeleteNode,
        handleAddNode,
      },
    }
    setNodes((nds) => [...nds, newNode])

    const newEdge = { id: `edge-${sourceNodeId}-${newNodeId}`, source: sourceNodeId, target: newNodeId, type: 'step' }
    setEdges((eds) => [...eds, newEdge])

    updateFlowSummary(sourceNodeId, newNodeId)
    toast.success(`${block.content} block added`)
  }

  // Function to add a block to the canvas
  const addBlock = (block) => {
    const newNodeId = Date.now().toString()
    const newNode = {
      id: newNodeId,
      type: block.id === 'stake' ? 'stakeNode' : 
            block.id === 'swap' ? 'swapNode' :
            'blockNode',
      position: { x: 100, y: 100 + nodes.length * 100 },
      data: {
        ...block,
        onNodeClick: handleNodeClick,
        uniqueId: newNodeId,
        handleDeleteNode,
        handleAddNode,
      },
    }
    setNodes((nds) => [...nds, newNode])
    toast.success(`${block.content} block added`)
  }

  // Effect to check if 'start' and 'end' nodes are present
  useEffect(() => {
    const hasStart = nodes.some(node => node.data.id === 'start')
    const hasEnd = nodes.some(node => node.data.id === 'end')
    setShowFinishButton(hasStart && hasEnd)
    setShowClearButton(nodes.length > 0)
  }, [nodes])

  // Function to handle the 'Finish' button click
  const handleFinish = () => {
    console.log("Finished! Transaction flow:", flowSummary)
    // Add your logic here for what should happen when the Finish button is clicked
  }

  // Function to clear the canvas
  const handleClear = () => {
    setNodes([])
    setEdges([])
    setFlowSummary([])
    toast.success('Blocks cleared')
  }

  // Function to open the modal for adding a custom block
  const handleAddCustomBlock = () => {
    setIsCredenzaOpen(true)
  }

  // Form submission handler for adding a custom block
  const onSubmit = (values) => {
    const newCustomBlock = {
      id: 'custom',
      content: values.blockName,
      color: 'bg-[#3C3C3C]',
      borderColor: 'border-[#6C6C6C]',
      hoverBorderColor: 'hover:border-[#9C9C9C]',
      icon: Code,
      code: values.solidityCode,
    }

    addBlock(newCustomBlock)
    setIsCredenzaOpen(false)
    form.reset()
    toast.success('Custom block added!')
  }

  // Function to handle node click (currently logs the node ID)
  const handleNodeClick = useCallback((event, node) => {
    setSelectedNode(node.id)
  }, [])

  // Function to update the flow summary based on the connected nodes
  const updateFlowSummary = useCallback((sourceId: string, targetId: string) => {
    const sourceNode = nodes.find((node) => node.id === sourceId);
    const targetNode = nodes.find((node) => node.id === targetId);

    if (!sourceNode || !targetNode) return;

    setFlowSummary((prevSummary) => {
      // If the summary is empty, add both source and target
      if (prevSummary.length === 0) {
        return [
          { content: sourceNode.data.content, id: sourceId },
          { content: targetNode.data.content, id: targetId }
        ];
      }

      // Find if the source is already in the summary
      const sourceIndex = prevSummary.findIndex(item => item.id === sourceId);
      
      if (sourceIndex !== -1) {
        // If source exists, add target after it and remove subsequent nodes
        return [
          ...prevSummary.slice(0, sourceIndex + 1),
          { content: targetNode.data.content, id: targetId }
        ];
      } else {
        // If source isn't found, check if target should be added to existing chain
        const lastNode = prevSummary[prevSummary.length - 1];
        if (lastNode && lastNode.id === sourceId) {
          return [...prevSummary, { content: targetNode.data.content, id: targetId }];
        }
      }

      return prevSummary;
    });
  }, [nodes]);

  const { getNodes, getEdges } = useReactFlow();

  const isValidConnection = useCallback(
    (connection) => {
      const nodes = getNodes();
      const edges = getEdges();
      const target = nodes.find((node) => node.id === connection.target);
      const hasCycle = (node, visited = new Set()) => {
        if (visited.has(node.id)) return false;

        visited.add(node.id);

        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === connection.source) return true;
          if (hasCycle(outgoer, visited)) return true;
        }
      };

      if (target.id === connection.source) return false;
      return !hasCycle(target);
    },
    [getNodes, getEdges]
  );

  const onConnect = useCallback((params) => {
    if (params) {
      setEdges((eds) => addEdge({
        ...params,
        type: 'smoothstep',
        animated: true,
        style: {
          strokeWidth: 2,
          stroke: '#FB118E',
        }
      }, eds));

      // Update flow summary when connection is made
      updateFlowSummary(params.source, params.target);
      
      // Optional: Show success toast
      toast.success('Blocks connected successfully');
    }
  }, [updateFlowSummary]);

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback((oldEdge, newConnection) => {
    edgeReconnectSuccessful.current = true;
    setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    updateFlowSummary(newConnection.source, newConnection.target);
  }, [updateFlowSummary]);

  const onReconnectEnd = useCallback((_, edge) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      // Remove the connection from the flow summary
      setFlowSummary((prevSummary) => {
        const sourceIndex = prevSummary.findIndex(item => item.id === edge.source);
        const targetIndex = prevSummary.findIndex(item => item.id === edge.target);
        if (sourceIndex !== -1 && targetIndex !== -1) {
          return prevSummary.slice(0, targetIndex);
        }
        return prevSummary;
      });
    }

    edgeReconnectSuccessful.current = true;
  }, []);

  // Custom edge styles
  const edgeStyles = {
    default: {
      stroke: '#555',
      strokeWidth: 2,
      transition: 'stroke 0.3s, stroke-width 0.3s',
    },
    selected: {
      stroke: '#FE007A',
      strokeWidth: 3,
    },
  }

  // Edge update function
  const edgeUpdateHandler = useCallback((oldEdge, newConnection) => {
    return { ...oldEdge, ...newConnection }
  }, [])

  // Add these custom edge styles and settings
  const connectionLineStyle = {
    strokeWidth: 2,
    stroke: '#FB118E',
    opacity: 0.7,
    animated: true
  };

  const edgeOptions = {
    type: 'smoothstep', // smoother curve type
    animated: true,
    style: {
      strokeWidth: 2,
      stroke: '#FB118E',
    }
  };

  // Custom edge with animation
  const AnimatedEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    selected,
  }) => {
    const [edgePathLength, setEdgePathLength] = useState(0);
    const edgePathRef = useRef(null);

    return (
      <>
        <path
          id={id}
          ref={edgePathRef}
          className={`react-flow__edge-path ${selected ? 'selected' : ''}`}
          d={`M ${sourceX} ${sourceY} C ${sourceX} ${(sourceY + targetY) / 2} ${targetX} ${(sourceY + targetY) / 2} ${targetX} ${targetY}`}
          strokeWidth={selected ? 3 : 2}
          stroke={selected ? '#FB118E' : 'rgba(251, 17, 142, 0.5)'}
          fill="none"
        />
        <circle
          className="react-flow__edge-interaction"
          r={12}
          stroke="transparent"
          fill="transparent"
          strokeWidth={20}
        />
      </>
    );
  };

  return (
    <div className="flex h-screen bg-[#141313] pt-8 selectable-none">
      {/* Sidebar */}
      <div className="relative translate-y-[1px] h-full">
        {/* Toggle sidebar button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-4 top-4 z-10 bg-gradient-to-br from-[#322131] to-[#21173E] border-[#FB118E]/20 text-white hover:bg-[#322131]/80"
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        {/* Info icon */}
        <div className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center cursor-pointer group">
          <Info className="size-8 text-white/60 group-hover:shadow-lg transition-shadow duration-300" />
          <div className="absolute hidden group-hover:block bg-gray-800 text-white/60 text-xs rounded-md p-2 -top-10 right-0">
            Information about the blocks
          </div>
        </div>

        {/* Sidebar content */}
        <motion.div
          initial={false}
          animate={{ width: isOpen ? "18.4rem" : "0rem" }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-[#322131] to-[#21173E] border-r border-[#FB118E]/20 overflow-hidden h-full flex flex-col"
        >
          <div className="p-6 w-72 pt-12 selectable-none cursor-default overflow-y-auto flex-grow">
            <h2 className="text-2xl font mt-5 mb-5 text-white">DeFi Blocks</h2>
            <div className="flex flex-col gap-6">
              {Object.entries(groupedBlocks).map(([category, blocks]) => (
                <div key={category}>
                  <h3 className="text-xs mb-2 text-white/80" style={{ color: blocks.length > 0 ? blocks[0].color.replace('bg-', '') : 'white' }}>
                    {category}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {blocks.map((block) => (
                      <div
                        key={block.id + block.content}
                        onClick={() => addBlock(block)}
                        className={`
                          bg-gradient-to-br from-[#322131] to-[#21173E] 
                          text-white p-3 rounded-lg cursor-pointer select-none
                          flex items-center justify-between 
                          border border-[#FB118E]/20 
                          hover:border-[#FB118E]/40 
                          transition-all duration-300
                          shadow-[0_0_15px_rgba(251,17,142,0.15)]
                          hover:shadow-[0_0_20px_rgba(251,17,142,0.25)]
                          transform hover:-translate-y-0.5
                        `}
                      >
                        <span>{block.content}</span>
                        <block.icon className="w-5 h-5 text-[#FB118E]" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Block button */}
          <div className="pb-12 p-6 w-72">
            <Button
              onClick={handleAddCustomBlock}
              className="bg-white text-black w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Block
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Main canvas area */}
      <motion.div
        className="flex-1 max-w-[52rem] flex flex-col ml-8"
        animate={{ marginLeft: isOpen ? "1rem" : "2rem" }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mt-4 mb-4">
          
          <div className="flex gap-2">
            {showClearButton && (
              <Button 
                onClick={handleClear} 
                className="px-6 bg-gradient-to-br from-[#322131] to-[#21173E] border border-[#FB118E]/20 hover:border-[#FB118E]/40 text-white"
              >
                Clear
              </Button>
            )}
            {showFinishButton && (
              <Button
                onClick={async () => {
                  setIsCompiling(true)
                  setShowCompilationModal(true)
                  
                  // Wait for 5 seconds
                  await new Promise(resolve => setTimeout(resolve, 15000))
                  
                  const encodedNodes = encodeURIComponent(JSON.stringify(nodes))
                  const encodedEdges = encodeURIComponent(JSON.stringify(edges))
                  const encodedFlowSummary = encodeURIComponent(JSON.stringify(flowSummary))
                  
                  setIsCompiling(false)
                  setShowCompilationModal(false)
                  router.push(`/compile?nodes=${encodedNodes}&edges=${encodedEdges}&flowSummary=${encodedFlowSummary}`)
                }}
                disabled={isCompiling}
                className="bg-gradient-to-br from-[#322131] to-[#21173E] border border-[#FB118E]/20 hover:border-[#FB118E]/40 text-white"
              >
                {isCompiling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Compiling
                  </>
                ) : (
                  'Compile'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div id="block-canvas" className="flex-1 rounded-lg shadow-inner p-4 min-h-[200px] overflow-hidden bg-gradient-to-br from-[#322131]/50 to-[#21173E]/50 border border-[#FB118E]/20">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            connectionMode="loose"
            snapToGrid={true}
            snapGrid={[15, 15]}
            defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
            minZoom={0.5}
            maxZoom={2}
            fitView
            className="bg-transparent"
            connectionRadius={40}
            elevateNodesOnSelect={true}
            selectNodesOnDrag={false}
            panOnDrag={[1, 2]}
            zoomOnScroll={true}
            zoomOnPinch={true}
            panOnScroll={false}
            preventScrolling={true}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            onNodeDragStart={(_, node) => {
              node.style = { transform: 'scale(1.05)' };
            }}
            onNodeDragStop={(_, node) => {
              node.style = { transform: 'scale(1)' };
            }}
            onConnectStart={(event, params) => {
              if (params?.nodeId) {
                const node = nodes.find(n => n.id === params.nodeId);
                if (node) {
                  node.style = { ...node.style, boxShadow: '0 0 30px rgba(251,17,142,0.4)' };
                }
              }
            }}
            onConnectEnd={(event) => {
              // Reset all nodes' styles
              setNodes((nds) =>
                nds.map((node) => ({
                  ...node,
                  style: { ...node.style, boxShadow: '' }
                }))
              );
            }}
          >
            <Background
              variant="dots"
              gap={20}
              size={1}
              color="rgba(251, 17, 142, 0.1)"
              className="bg-transparent"
            />
            <Controls
              className="bg-gradient-to-br from-[#322131] to-[#21173E] border border-[#FB118E]/20 rounded-lg p-2 flex flex-col gap-2"
            />
            
          </ReactFlow>
        </div>
      </motion.div>

      {/* Flow summary on the right */}
      <motion.div
        className="ml-8 px-8 pt-2 bg-gradient-to-br from-[#322131] to-[#21173E] border-t border-l border-[#FB118E]/20 z-10 relative right-0 h-screen"
        animate={{ width: isOpen ? "30rem" : "40rem" }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl mt-4 mb-4 text-[#FB118E] font-bold">Flow Summary</h2>
        <div className="bg-gradient-to-br from-[#322131]/50 to-[#21173E]/50 rounded-lg shadow-md p-4 border border-[#FB118E]/20">
          {flowSummary.length === 0 ? (
            <div className="text-white/60 text-center py-4">
              Connect blocks to see the flow summary
            </div>
          ) : (
            flowSummary.map((item, index) => (
              <div key={index} className="mb-4 flex items-center group">
                <span className="mr-3 text-[#FB118E] font-bold">{index + 1}.</span>
                <div className="flex flex-col">
                  <span className="text-white group-hover:text-[#FB118E] transition-colors">
                    {item.content}
                  </span>
                  {index < flowSummary.length - 1 && (
                    <div className="h-6 w-px bg-[#FB118E]/20 ml-[6px] my-1" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Modal for adding custom blocks */}
      <CustomBlockModal
        isOpen={isCredenzaOpen}
        onOpenChange={setIsCredenzaOpen}
        onSubmit={onSubmit}
      />

      <CompilationModal isOpen={showCompilationModal} />
    </div>
  )
}

// Wrap the main component with ReactFlowProvider
const Web3BlocksComponentWrapper = () => (
  <ReactFlowProvider>
    <Web3BlocksComponent />
  </ReactFlowProvider>
)

export default Web3BlocksComponentWrapper
