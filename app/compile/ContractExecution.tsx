'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from 'react';
import { openContractCall } from '@stacks/connect';
import { 
  AnchorMode, 
  PostConditionMode, 
  stringUtf8CV, 
  uintCV,
  Pc,
  Cl
} from '@stacks/transactions';


interface FunctionParam {
  name: string;
  type: string;
}

interface ContractFunction {
  name: string;
  params: FunctionParam[];
}

interface ContractFunctions {
  publicFunctions: ContractFunction[];
  readOnlyFunctions: string[];
}

interface ContractExecutionProps {
  contractCalls?: ContractFunctions;
}

const ContractExecution: React.FC<ContractExecutionProps> = ({ contractCalls = [] }) => {
  const [contractAddress, setContractAddress] = useState('');
  const [functions, setFunctions] = useState<ContractFunctions>({
    publicFunctions: [],
    readOnlyFunctions: []
  });
  const [functionParams, setFunctionParams] = useState<{ [key: string]: { [key: string]: string } }>({});
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isModalOpen) {
      timer = setTimeout(() => {
        setIsModalOpen(false);
        // Set the functions after modal closes with their parameters
        setFunctions({
          publicFunctions: [
            {
              name: 'deposit',
              params: [{ name: 'amount', type: 'uint' }]
            },
            {
              name: 'borrow',
              params: [{ name: 'amount', type: 'uint' }]
            },
            {
              name: 'repay',
              params: [{ name: 'amount', type: 'uint' }]
            },
            {
              name: 'claim-yield',
              params: [{ name: 'amount', type: 'uint' }]
            }
          ],
          readOnlyFunctions: ['get-balance-by-sender', 'get-balance', 'get-amount-owed']
        });
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isModalOpen]);

  const handleParamChange = (functionName: string, paramName: string, value: string) => {
    setFunctionParams(prev => ({
      ...prev,
      [functionName]: {
        ...(prev[functionName] || {}),
        [paramName]: value
      }
    }));
  };

  const handleExecuteFunction = async (functionName: string) => {
    try {
      const [address, contractName] = contractAddress.split('.');
      
      let functionArgs = [];
      let postConditions = [];

      // Special handling for specific functions
      switch (functionName) {
        case 'deposit':
          if (!functionParams[functionName]?.['amount']) {
            setError('Please enter an amount to deposit');
            return;
          }
          const depositAmount = parseInt(functionParams[functionName]['amount']);
          if (depositAmount <= 0) {
            setError('Deposit amount must be greater than 0');
            return;
          }

          // Post condition for deposit: ensure sender's STX balance decreases by depositAmount
          // const depositPostCondition = makeStandardSTXPostCondition(
          //   address,
          //   FungibleConditionCode.Equal,
          //   depositAmount
          // );

          // // Post condition for contract: ensure contract receives the STX
          // const contractDepositPostCondition = makeContractSTXPostCondition(
          //   address,
          //   contractName,
          //   FungibleConditionCode.GreaterEqual,
          //   depositAmount
          // );

          functionArgs = [uintCV(depositAmount)];
          postConditions = [depositPostCondition, contractDepositPostCondition];
          break;

        case 'borrow':
          if (!functionParams[functionName]?.['amount']) {
            setError('Please enter an amount to borrow');
            return;
          }
          const borrowAmount = parseInt(functionParams[functionName]['amount']);
          if (borrowAmount <= 0) {
            setError('Borrow amount must be greater than 0');
            return;
          }
          if (borrowAmount > 1000000) {
            setError('Borrow amount exceeds maximum limit');
            return;
          }

          // Post condition for borrow: ensure sender's STX balance increases by borrowAmount
          // const borrowPostCondition = makeStandardSTXPostCondition(
          //   address,
          //   FungibleConditionCode.GreaterEqual,
          //   borrowAmount
          // );

          // // Post condition for contract: ensure contract has enough STX to lend
          // const contractBorrowPostCondition = makeContractSTXPostCondition(
          //   address,
          //   contractName,
          //   FungibleConditionCode.GreaterEqual,
          //   borrowAmount
          // );

          functionArgs = [uintCV(borrowAmount)];
          // postConditions = [borrowPostCondition, contractBorrowPostCondition];
          break;

        default:
          // For other functions, use standard parameter handling without post conditions
          functionArgs = functionParams[functionName] 
            ? Object.values(functionParams[functionName]).map(value => uintCV(parseInt(value)))
            : [];
          postConditions = [];
      }

      let p1 = Pc.principal("ST1HSHW75B8QVT6TB31DJRKRNDSKSPD4B19GC7J4Y.stx-defi").willSendEq(10000).ft("ST1HSHW75B8QVT6TB31DJRKRNDSKSPD4B19GC7J4Y.stx-defi", contractName)
        
      
      await openContractCall({
        network: 'testnet',
        anchorMode: AnchorMode.Any,
        contractAddress: address,
        contractName,
        functionName,
        functionArgs,
        postConditionMode: PostConditionMode.Deny,
        postConditions: [p1],
        onFinish: (response) => {
          console.log('Transaction:', response);
          switch (functionName) {
            case 'deposit':
              console.log(`Successfully deposited ${functionParams[functionName]['amount']} tokens`);
              break;
            case 'borrow':
              console.log(`Successfully borrowed ${functionParams[functionName]['amount']} tokens`);
              break;
          }
        },
        onCancel: () => {
          console.log('Transaction canceled');
          setError('Transaction was canceled');
        }
      });
    } catch (err) {
      console.error('Error executing function:', err);
      setError('Failed to execute function: ' + (err as Error).message);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="bg-gradient-to-br from-[#322131] to-[#21173E] rounded-2xl shadow-2xl border border-[#FB118E]/20">
        {/* Header Section */}
        <div className="p-6 border-b border-[#FB118E]/20">
          <h2 className="text-2xl font-bold text-white">Contract Execution</h2>
          <p className="text-white/60 mt-2">
            Enter your contract address and interact with its functions
          </p>
        </div>

        {/* Contract Input Section */}
        <div className="p-6 border-b border-[#FB118E]/20">
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 mb-2 text-sm">
                Contract Address
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => {
                    setContractAddress(e.target.value);
                    setError('');
                  }}
                  className={`flex-1 bg-black/20 border ${
                    error ? 'border-red-500' : 'border-white/10'
                  } rounded-lg px-4 py-2 text-white focus:border-[#FB118E] focus:outline-none transition-colors`}
                  placeholder="Enter contract address (e.g., ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.contract-name)"
                />
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={!contractAddress.trim()}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#FB118E] to-[#FB118E]/80 text-white 
                           hover:from-[#FB118E]/90 hover:to-[#FB118E]/70 transition-all duration-300 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transform hover:scale-[1.02] active:scale-[0.98]
                           shadow-lg hover:shadow-[#FB118E]/20"
                >
                  Let&apos;s Go
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>
          </div>
        </div>

        {/* Functions Section */}
        {(functions.publicFunctions.length > 0 || functions.readOnlyFunctions.length > 0) && (
          <div className="p-6 space-y-6">
            {/* Public Functions */}
            {functions.publicFunctions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Public Functions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {functions.publicFunctions.map((func, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-black/30 rounded-lg border border-white/10"
                    >
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        {func.name === 'deposit' && '💰'}
                        {func.name === 'borrow' && '🏦'}
                        {func.name}
                      </h4>
                      {func.params.map((param, pIndex) => (
                        <div key={pIndex} className="mb-3">
                          <label className="block text-white/60 text-sm mb-1">
                            {param.name} ({param.type})
                            {func.name === 'deposit' && (
                              <span className="ml-2 text-[#FB118E]/70">
                                (Min: 1 token)
                              </span>
                            )}
                            {func.name === 'borrow' && (
                              <span className="ml-2 text-[#FB118E]/70">
                                (Max: 1,000,000 tokens)
                              </span>
                            )}
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={func.name === 'borrow' ? 1000000 : undefined}
                            onChange={(e) => {
                              handleParamChange(func.name, param.name, e.target.value);
                              setError('');
                            }}
                            value={functionParams[func.name]?.[param.name] || ''}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#FB118E] focus:outline-none"
                            placeholder={`Enter ${param.name}`}
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => handleExecuteFunction(func.name)}
                        disabled={!functionParams[func.name]?.amount}
                        className={`w-full px-4 py-2 rounded-lg text-white text-sm transition-colors
                          ${
                            func.name === 'deposit'
                              ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-500/50'
                              : func.name === 'borrow'
                              ? 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50'
                              : 'bg-[#FB118E] hover:bg-[#FB118E]/80 disabled:bg-[#FB118E]/50'
                          } disabled:cursor-not-allowed`}
                      >
                        Execute {func.name}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Read-Only Functions */}
            {functions.readOnlyFunctions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Read-Only Functions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {functions.readOnlyFunctions.map((func, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-black/30 rounded-lg border border-white/10"
                    >
                      <button
                        onClick={() => handleExecuteFunction(func)}
                        className="w-full px-4 py-3 rounded-lg bg-[#FB118E]/50 text-white hover:bg-[#FB118E]/40 transition-colors"
                      >
                        {func}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-[#322131] to-[#21173E] p-8 rounded-2xl shadow-2xl border border-[#FB118E]/20 max-w-md w-full mx-4"
            >
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-[#FB118E]/20 rounded-full animate-spin">
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-[#FB118E] rounded-full" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white text-center">
                  Analyzing Contract Functions
                </h3>
                <p className="text-white/60 text-center">
                  Please wait while we process your request...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContractExecution;