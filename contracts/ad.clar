;; Ad Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-exists (err u102))

;; Data Variables
(define-data-var last-ad-id uint u0)

;; Data Maps
(define-map ads
  { ad-id: uint }
  {
    advertiser: principal,
    content-url: (string-utf8 256),
    target-demographics: (list 10 (string-ascii 20)),
    budget: uint,
    status: (string-ascii 10)
  }
)

;; Public Functions

;; Create a new ad campaign
(define-public (create-ad (content-url (string-utf8 256)) (target-demographics (list 10 (string-ascii 20))) (budget uint))
  (let
    (
      (ad-id (+ (var-get last-ad-id) u1))
    )
    (map-set ads
      { ad-id: ad-id }
      {
        advertiser: tx-sender,
        content-url: content-url,
        target-demographics: target-demographics,
        budget: budget,
        status: "active"
      }
    )
    (var-set last-ad-id ad-id)
    (ok ad-id)
  )
)

;; Update ad campaign status
(define-public (update-ad-status (ad-id uint) (new-status (string-ascii 10)))
  (let
    (
      (ad (unwrap! (map-get? ads { ad-id: ad-id }) err-not-found))
    )
    (asserts! (is-eq tx-sender (get advertiser ad)) err-owner-only)
    (ok (map-set ads
      { ad-id: ad-id }
      (merge ad { status: new-status })
    ))
  )
)

;; Update ad campaign budget
(define-public (update-ad-budget (ad-id uint) (new-budget uint))
  (let
    (
      (ad (unwrap! (map-get? ads { ad-id: ad-id }) err-not-found))
    )
    (asserts! (is-eq tx-sender (get advertiser ad)) err-owner-only)
    (ok (map-set ads
      { ad-id: ad-id }
      (merge ad { budget: new-budget })
    ))
  )
)

;; Read-only Functions

;; Get ad details
(define-read-only (get-ad (ad-id uint))
  (ok (unwrap! (map-get? ads { ad-id: ad-id }) err-not-found))
)

;; Initialize contract
(begin
  (var-set last-ad-id u0)
)

