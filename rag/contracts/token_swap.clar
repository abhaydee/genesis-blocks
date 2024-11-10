;; Define constants
(define-constant CONTRACT_OWNER tx-sender)

;; Define map for storing token balances
(define-map balances {token: principal, owner: principal} uint)

;; Initialize the contract with some tokens for testing
(begin
  (map-set balances {token: 'STX, owner: CONTRACT_OWNER} u1000000)
  (map-set balances {token: 'TOKEN, owner: CONTRACT_OWNER} u1000000)
)

;; Public function to swap tokens
(define-public (swap (amount-in uint) (token-in principal) (token-out principal))
  (let 
    (
      ;; Get the sender's balance of token-in
      (balance-in (unwrap! (map-get? balances {token: token-in, owner: tx-sender}) ERR_INSUFFICIENT_BALANCE))
      ;; Get the contract's balance of token-out
      (contract-balance-out (unwrap! (map-get? balances {token: token-out, owner: CONTRACT_OWNER}) ERR_INSUFFICIENT_CONTRACT_BALANCE))
    )

    ;; Ensure the sender has enough balance to swap
    (asserts! (>= balance-in amount-in) ERR_INSUFFICIENT_BALANCE)
    ;; Ensure the contract has enough token-out to fulfill the swap
    (asserts! (>= contract-balance-out amount-in) ERR_INSUFFICIENT_CONTRACT_BALANCE)

    ;; Transfer token-in from sender to contract
    (map-set balances {token: token-in, owner: tx-sender} (- balance-in amount-in))
    (map-set balances {token: token-in, owner: CONTRACT_OWNER} (+ (default-to u0 (map-get? balances {token: token-in, owner: CONTRACT_OWNER})) amount-in))

    ;; Transfer token-out from contract to sender
    (map-set balances {token: token-out, owner: CONTRACT_OWNER} (- contract-balance-out amount-in))
    (map-set balances {token: token-out, owner: tx-sender} (+ (default-to u0 (map-get? balances {token: token-out, owner: tx-sender})) amount-in))

    (ok true)
  )
)

;; Error messages
(define-constant ERR_INSUFFICIENT_BALANCE (err u100))
(define-constant ERR_INSUFFICIENT_CONTRACT_BALANCE (err u101))

;; Helper function to get balance of token for a user
(define-read-only (get-balance (token principal) (user principal))
  (default-to u0 (map-get? balances {token: token, owner: user}))
)

;; Helper function to get contract's balance of token
(define-read-only (get-contract-balance (token principal))
  (get-balance token CONTRACT_OWNER)
)