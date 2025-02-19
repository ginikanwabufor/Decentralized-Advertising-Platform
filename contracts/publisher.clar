;; Publisher Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-exists (err u102))

;; Data Variables
(define-data-var last-publisher-id uint u0)

;; Data Maps
(define-map publishers
  { publisher-id: uint }
  {
    owner: principal,
    website: (string-utf8 256),
    ad-spaces: (list 10 (string-ascii 20)),
    earnings: uint
  }
)

;; Public Functions

;; Register a new publisher
(define-public (register-publisher (website (string-utf8 256)) (ad-spaces (list 10 (string-ascii 20))))
  (let
    (
      (publisher-id (+ (var-get last-publisher-id) u1))
    )
    (map-set publishers
      { publisher-id: publisher-id }
      {
        owner: tx-sender,
        website: website,
        ad-spaces: ad-spaces,
        earnings: u0
      }
    )
    (var-set last-publisher-id publisher-id)
    (ok publisher-id)
  )
)

;; Update publisher ad spaces
(define-public (update-ad-spaces (publisher-id uint) (new-ad-spaces (list 10 (string-ascii 20))))
  (let
    (
      (publisher (unwrap! (map-get? publishers { publisher-id: publisher-id }) err-not-found))
    )
    (asserts! (is-eq tx-sender (get owner publisher)) err-owner-only)
    (ok (map-set publishers
      { publisher-id: publisher-id }
      (merge publisher { ad-spaces: new-ad-spaces })
    ))
  )
)

;; Record publisher earnings
(define-public (record-earnings (publisher-id uint) (amount uint))
  (let
    (
      (publisher (unwrap! (map-get? publishers { publisher-id: publisher-id }) err-not-found))
    )
    (ok (map-set publishers
      { publisher-id: publisher-id }
      (merge publisher { earnings: (+ (get earnings publisher) amount) })
    ))
  )
)

;; Read-only Functions

;; Get publisher details
(define-read-only (get-publisher (publisher-id uint))
  (ok (unwrap! (map-get? publishers { publisher-id: publisher-id }) err-not-found))
)

;; Initialize contract
(begin
  (var-set last-publisher-id u0)
)

