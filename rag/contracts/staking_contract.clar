;; Constants
(define-constant CONTRACT_OWNER tx-sender)

;; Data Variables
(define-data-var total-staked uint u0)
(define-data-var staking-reward-rate uint u1) ;; Reward rate per block, can be adjusted

;; Map for keeping track of staked tokens per address
(define-map staker-info {staker: principal} {amount: uint, last-reward-calc: uint})

;; Public function to stake tokens
(define-public (stake (amount uint))
  (let 
    (
      (user-balance (get-balance tx-sender))
    )
    ;; Ensure the user has enough tokens to stake
    (asserts! (>= user-balance amount) ERR_NOT_ENOUGH_TOKENS)

    ;; Update the user's balance
    (map-set staker-info {staker: tx-sender} {amount: (+ (default-to u0 (get amount (map-get? staker-info {staker: tx-sender}))) amount), last-reward-calc: block-height})

    ;; Update total staked tokens
    (var-set total-staked (+ (var-get total-staked) amount))

    ;; Transfer tokens to the contract (This part would typically be handled by a separate token contract)
    ;; For simplicity, we're just updating the balance here

    (ok true)
  )
)

;; Public function to unstake tokens
(define-public (unstake (amount uint))
  (let 
    (
      (current-stake (get-staked-amount tx-sender))
    )
    ;; Ensure the user has staked enough to unstake this amount
    (asserts! (>= current-stake amount) ERR_NOT_ENOUGH_STAKED)

    ;; Update the user's staked amount
    (map-set staker-info {staker: tx-sender} {amount: (- current-stake amount), last-reward-calc: block-height})

    ;; Update total staked tokens
    (var-set total-staked (- (var-get total-staked) amount))

    ;; Transfer tokens back to the user (This part would typically be handled by a separate token contract)
    ;; For simplicity, we're just updating the balance here

    (ok true)
  )
)

;; Function to claim staking rewards
(define-public (claim-rewards)
  (let 
    (
      (staker-info (unwrap! (map-get? staker-info {staker: tx-sender}) ERR_NOT_STAKING))
      (amount-staked (get amount staker-info))
      (last-reward-calc (get last-reward-calc staker-info))
      (blocks-passed (- block-height last-reward-calc))
      (rewards (+ amount-staked (* amount-staked (var-get staking-reward-rate) blocks-passed)))
    )
    ;; Update the last reward calculation time
    (map-set staker-info {staker: tx-sender} {amount: amount-staked, last-reward-calc: block-height})

    ;; Transfer rewards to the user (This part would typically be handled by a separate token contract)
    ;; For simplicity, we're just returning the reward amount here

    (ok rewards)
  )
)

;; Helper function to get staked amount
(define-read-only (get-staked-amount (user principal))
  (default-to u0 (get amount (map-get? staker-info {staker: user})))
)

;; Helper function to get total staked tokens
(define-read-only (get-total-staked)
  (var-get total-staked)
)

;; Error messages
(define-constant ERR_NOT_ENOUGH_TOKENS (err u100))
(define-constant ERR_NOT_ENOUGH_STAKED (err u101))
(define-constant ERR_NOT_STAKING (err u102))

;; Assume get-balance function exists elsewhere or in another contract
;; This is a placeholder for a token contract's balance check
(define-read-only (get-balance (user principal))
  u1000 ;; Dummy balance for example, should be replaced with actual token balance check
)