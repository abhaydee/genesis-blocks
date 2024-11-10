'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FlowGraph from '@/app/compile/FlowGraph';
import { Button } from '@/components/ui/button';
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { ArrowLeft, Blocks as BlocksIcon, Loader2 } from 'lucide-react';
import { AppConfig, UserSession, showConnect, openContractDeploy } from '@stacks/connect';
import { sonner as toast } from 'sonner';
import { AnchorMode, PostConditionMode } from '@stacks/transactions';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const contractName = 'token-swap';
const contractCode = `;; Define the contract's data variables

;; Maps a user's principal address to their deposited amount.
(define-map deposits { owner: principal } { amount: uint })

;; Maps a borrower's principal address to their loan details: amount and the last interaction block.
(define-map loans principal { amount: uint, last-interaction-block: uint })

;; Holds the total amount of deposits in the contract, initialized to 0.
(define-data-var total-deposits uint u0)

;; Represents the reserve funds in the pool, initialized to 0.
(define-data-var pool-reserve uint u0)

;; The interest rate for loans, represented as 10% (out of a base of 100).
(define-data-var loan-interest-rate uint u10) ;; Representing 10% interest rate

;; Error constants for various failure scenarios.
(define-constant err-no-interest (err u100))
(define-constant err-overpay (err u200))
(define-constant err-overborrow (err u300))

;; Public function for users to deposit STX into the contract.
;; Updates their balance and the total deposits in the contract.
(define-public (deposit (amount uint))
    (let (
        ;; Fetch the current balance or default to 0 if none exists.
        (current-balance (default-to u0 (get amount (map-get? deposits { owner: tx-sender }))))
        )
        ;; Transfer the STX from sender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" to recipient = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.stx-defi (ie: contract identifier on the chain!)".
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        ;; Update the user's deposit amount in the map.
        (map-set deposits { owner: tx-sender } { amount: (+ current-balance amount) })
        ;; Update the total deposits variable.
        (var-set total-deposits (+ (var-get total-deposits) amount))
        ;; Return success.
        (ok true)
    )
)

;; Public function for users to borrow STX based on their deposits.
(define-public (borrow (amount uint))
    (let (
        ;; Fetch user's deposit or default to 0.
        (user-deposit (default-to u0 (get amount (map-get? deposits { owner: tx-sender }))))
        ;; Calculate the maximum amount the user is allowed to borrow. (which will be upto HALF of what they deposited)
        (allowed-borrow (/ user-deposit u2))
        ;; Fetch current loan details or default to initial values.
        (current-loan-details (default-to { amount: u0, last-interaction-block: u0 } (map-get? loans tx-sender )))
        ;; Calculate accrued interest on the current loan.
        (accrued-interest (calculate-accrued-interest (get amount current-loan-details) (get last-interaction-block current-loan-details)))
        ;; Calculate the total amount due including interest.
        (total-due (+ (get amount current-loan-details) (unwrap-panic accrued-interest)))
        ;; Calculate the new loan total after borrowing additional amount.
        (new-loan (+ amount))
    )
        ;; Ensure the requested borrow amount does not exceed the allowed amount.
        (asserts! (<= new-loan allowed-borrow) err-overborrow)
        ;; Transfer the borrowed STX to the user.
        (let ((recipient tx-sender))
            (try! (as-contract (stx-transfer? amount tx-sender recipient)))
        )
        ;; Update the user's loan details in the map.
        (map-set loans tx-sender { amount: new-loan, last-interaction-block: burn-block-height })
        ;; Return success.
        (ok true)
    )
)

;; Read-only function to get the total balance by tx-sender
(define-read-only (get-balance-by-sender)
    (ok (map-get? deposits { owner: tx-sender }))
)

;; Read-only function to get the total balance 
(define-read-only (get-balance)
    (ok (var-get total-deposits))
)

;; Read-only function to get the total amount owed by the user.
(define-read-only (get-amount-owed)
    (let (
        ;; Fetch current loan details or default to initial values.
        (current-loan-details (default-to { amount: u0, last-interaction-block: u0 } (map-get? loans tx-sender )))
        ;; Calculate accrued interest on the current loan.
        (accrued-interest (calculate-accrued-interest (get amount current-loan-details) (get last-interaction-block current-loan-details)))
        ;; Calculate the total amount due including interest.
        (total-due (+ (get amount current-loan-details) (unwrap-panic accrued-interest)))
    )
    ;; Return the total amount due.
    (ok total-due)
    )
)

;; Public function for users to repay their STX loans.
(define-public (repay (amount uint))
    (let (
        ;; Fetch current loan details or default to initial values.
        (current-loan-details (default-to { amount: u0, last-interaction-block: u0 } (map-get? loans tx-sender )))
        ;; Calculate accrued interest since the last interaction.
        (accrued-interest (unwrap! (calculate-accrued-interest (get amount current-loan-details) (get last-interaction-block current-loan-details)) err-no-interest))
        ;; Calculate the total amount due including accrued interest.
        (total-due (+ (get amount current-loan-details) accrued-interest))
    )
        ;; Ensure the repayment amount is not more than the total due.
        (asserts! (>= total-due amount) err-overpay)
        ;; Transfer the repayment amount from the user to the contract.
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        ;; Update the user's loan details in the map with the new total due.
        (map-set loans tx-sender { amount: (- total-due amount), last-interaction-block: burn-block-height })
        ;; Update the pool reserve with the paid interest.
        (var-set pool-reserve (+ (var-get pool-reserve) accrued-interest))
        ;; Return success.
        (ok true)
    )
)

;; Public function for users to claim their yield based on the pool reserve and their deposits.
(define-public (claim-yield)
    (let (
        ;; Fetch user's deposit amount or default to 0.
        (user-deposit (default-to u0 (get amount (map-get? deposits { owner: tx-sender }))))
        ;; Calculate the yield amount based on user's share of the pool.
        (yield-amount (/ (* (var-get pool-reserve) user-deposit) (var-get total-deposits)))
    )
        ;; Transfer the yield amount from the contract to the user.
        (let ((recipient tx-sender))
            (try! (as-contract (stx-transfer? yield-amount tx-sender recipient)))
        )
        ;; Update the pool reserve by subtracting the claimed yield.
        (var-set pool-reserve (- (var-get pool-reserve) yield-amount))
        ;; Return success.
        (ok true)
    )
)

;; Private function to calculate the accrued interest on a loan.
(define-private (calculate-accrued-interest (principal uint) (start-block uint))
    (let (
        ;; Calculate the number of blocks elapsed since the last interaction.
        (elapsed-blocks (- burn-block-height start-block))
        ;; Calculate the interest based on the principal, rate, and elapsed time.
        (interest (/ (* principal (var-get loan-interest-rate) elapsed-blocks) u10000))
    )
        ;; Ensure the loan started in the past (not at block 0).
        (asserts! (not (is-eq start-block u0)) (ok u0))
        ;; Return the calculated interest.
       (ok interest)
    )
)`;


const CompilePage: React.FC = () => {
    const searchParams = useSearchParams();
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [flowSummary, setFlowSummary] = useState([]);
    const [apiResponse, setApiResponse] = useState(null); // Add state for API response
    const [bytecode, setBytecode] = useState(null);
    const [abi, setAbi] = useState(null);
    const [hash, setHash] = useState<`0x${string}` | null>(null);
    const [userSession, setUserSession] = useState<UserSession | null>(null)
    const [walletAddress, setWalletAddress] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isDeploying, setIsDeploying] = useState(false)

    // Initialize user session
    useEffect(() => {
        const appConfig = new AppConfig(['store_write', 'publish_data'])
        const session = new UserSession({ appConfig })
        setUserSession(session)
        
        // Check if user is already signed in
        if (session.isUserSignedIn()) {
            const userData = session.loadUserData()
            setWalletAddress(userData.profile.stxAddress.testnet)
            setIsConnected(true)
        }
    }, [])

    useEffect(() => {
        const nodesParam = searchParams.get('nodes');
        const edgesParam = searchParams.get('edges');
        const flowSummaryParam = searchParams.get('flowSummary');
        if (nodesParam && edgesParam && flowSummaryParam) {
            setNodes(JSON.parse(decodeURIComponent(nodesParam)));
            setEdges(JSON.parse(decodeURIComponent(edgesParam)));
            setFlowSummary(JSON.parse(decodeURIComponent(flowSummaryParam)));
        }
    }, [searchParams]);

    useEffect(() => {
        // This effect will run whenever the hash changes
        // You can add any additional logic here if needed
    }, [hash]);

    const handleConnectWallet = () => {
        if (!userSession) return

        showConnect({
            appDetails: {
                name: 'BlockBuild',
                icon: window.location.origin + '/favicon.ico',
            },
            redirectTo: '/compile',
            onFinish: () => {
                try {
                    if (userSession.isUserSignedIn()) {
                        const userData = userSession.loadUserData()
                        setWalletAddress(userData.profile.stxAddress.testnet)
                        setIsConnected(true)
                        toast.success('Successfully connected to Leather Wallet!', {
                            position: 'top-right',
                            duration: 3000,
                        })
                    }
                } catch (error) {
                    console.error('Error in onFinish:', error)
                    toast.error('Failed to connect wallet', { position: 'top-right' })
                }
            },
            onCancel: () => {
                try {
                    setIsConnected(false)
                    setWalletAddress(null)
                    toast.error('Connection cancelled', { position: 'top-right' })
                } catch (error) {
                    console.error('Error in onCancel:', error)
                }
            },
            userSession: userSession
        })
    }

    const handleDeployContract = async () => {
        if (!walletAddress || !userSession) {
            toast.error('Connect wallet first!', { position: 'top-right' })
            return
        }

        try {
            await openContractDeploy({
                contractName: 'stx-defi',
                codeBody: contractCode,
                network: 'testnet',
                anchorMode: AnchorMode.Any,
                onFinish: (data: any) => {
                    try {
                        if (data.txId) {
                            setHash(data.txId as `0x${string}`)
                            toast.success('Contract deployed successfully!', { 
                                position: 'top-right',
                                duration: 3000 
                            })
                        }
                    } catch (error) {
                        console.error('Error in deploy onFinish:', error)
                        toast.error('Error completing deployment', { position: 'top-right' })
                    }
                },
                onCancel: () => {
                    try {
                        toast.error('Deployment cancelled', { position: 'top-right' })
                    } catch (error) {
                        console.error('Error in deploy onCancel:', error)
                    }
                }
            })
        } catch (error) {
            console.error('Deployment error:', error)
            toast.error(`Failed to deploy contract: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                position: 'top-right'
            })
        }
    }

    return (
        <div className="flex flex-col min-h-screen text-white bg-[#1A0F24]">
            <Navbar />
            {/* <Sidebar /> */}

            <div className="flex-grow flex justify-between px-8 py-4 mt-16">
                {/* Left Section */}
                <div className="flex-1 pr-8 pl-4">
                    {/* Wallet Section */}
                    <div className="mb-2 bg-gradient-to-br from-[#322131] to-[#21173E] p-6 rounded-xl border border-[#FB118E]/20 shadow-lg">
                        <Button
                            onClick={handleConnectWallet}
                            className="bg-[#322131] hover:bg-[#21173E] text-white px-6 py-2 rounded-lg flex items-center gap-2 border border-[#FB118E]/20 hover:border-[#FB118E]/40 transition-all duration-300"
                            disabled={isConnected || !userSession}
                        >
                            {isConnected ? (
                                <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    Wallet Connected
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                                    {userSession ? 'Connect Wallet' : 'Initializing...'}
                                </>
                            )}
                        </Button>
                        {walletAddress && (
                            <p className="mt-1 text-[#FB118E]">
                                Wallet Address: <span className="text-white/60">{walletAddress}</span>
                            </p>
                        )}
                    </div>

                    {/* Flow Graph */}
                    <div className="bg-gradient-to-br from-[#322131] to-[#21173E] p-6 rounded-xl border border-[#FB118E]/20 shadow-lg">
                        <h2 className="text-2xl font-bold text-[#FB118E] ">Flow Graph</h2>
                        <FlowGraph
                            nodes={nodes}
                            edges={edges}
                            flowSummary={flowSummary}
                        />
                        
                        <div className="flex gap-2">
                            <Link href="/">
                                <Button variant="ghost" className="text-white/50 hover:text-white hover:bg-white/5 group">
                                    <ArrowLeft className="w-4 h-4 mr-1 translate-x-1 group-hover:translate-x-0 transition-transform duration-300 ease-in-out" />
                                    Back
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Enter the contract address in this field and click the button to view the contract read and write calls using stackjs libraray */}
                </div>

                {/* Right Section */}
                <div className="w-1/2">
                    <div className="bg-gradient-to-br from-[#322131] to-[#21173E] p-6 rounded-xl border border-[#FB118E]/20 shadow-lg h-full">
                        <h2 className="text-2xl font-bold text-[#FB118E] mb-6">Contract Code</h2>
                        <div className="overflow-auto max-h-[calc(100vh-300px)] rounded-lg bg-black/20 border border-[#FB118E]/10">
                            <SyntaxHighlighter
                                language="lisp"
                                style={vscDarkPlus}
                                customStyle={{
                                    background: 'transparent',
                                    padding: '1.5rem',
                                    margin: 0,
                                    fontSize: '0.875rem',
                                }}
                                wrapLines={true}
                                showLineNumbers={true}
                            >
                                {contractCode}
                            </SyntaxHighlighter>
                        </div>

                        {apiResponse && (
                            <div className="mt-6">
                                <h3 className="text-xl font-bold text-[#FB118E] mb-4">Compilation Result</h3>
                                <div className="bg-black/20 border border-[#FB118E]/10 rounded-lg p-4">
                                    <pre className="text-sm text-white/80 font-mono whitespace-pre-wrap">
                                        {JSON.stringify(apiResponse, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Deploy Button */}
            <div className="fixed bottom-16 right-16">
                <Button
                    variant="default"
                    className="bg-gradient-to-r from-[#FB118E] to-[#FB118E]/80 hover:from-[#FB118E]/90 hover:to-[#FB118E]/70 text-white border border-[#FB118E]/20 shadow-lg transition-all duration-300"
                    onClick={handleDeployContract}
                    disabled={!isConnected || isDeploying}
                >
                    {isDeploying ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deploying...
                        </>
                    ) : (
                        <>
                            <BlocksIcon className="w-4 h-4 mr-2" />
                            {isConnected ? 'Deploy Contract' : 'Connect Wallet to Deploy'}
                        </>
                    )}
                </Button>
            </div>

            {/* Transaction Hash Info */}
            {hash && (
                <div className="fixed bottom-16 right-4 bg-gradient-to-br from-[#322131] to-[#21173E] p-4 rounded-xl border border-[#FB118E]/20 shadow-lg">
                    <h3 className="text-lg font-bold text-[#FB118E] mb-2">Contract Deployed</h3>
                    <p className="text-sm text-white/60">Transaction Hash:</p>
                    <p className="text-xs font-mono break-all text-white/80">{hash}</p>
                </div>
            )}
        </div>
    );
};

export default CompilePage;
