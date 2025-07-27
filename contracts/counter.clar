;; Dinh nghia hop dong thong minh Crowdfunding
(define-data-var funding-goal uint u1000000) ;; Muc tieu gay quy (1 trieu microSTX)
(define-data-var deadline uint u1000) ;; Thoi han (chieu cao khoi)
(define-data-var total-pledged uint u0) ;; Tong so STX da dong gop
(define-data-var project-owner principal tx-sender) ;; Nguoi tao du an
(define-map pledges principal uint) ;; Luu tru so tien dong gop cua tung nguoi
(define-data-var funding-successful bool false) ;; Trang thai dat muc tieu

;; Ham dong gop STX
(define-public (pledge (amount uint))
  (let ((current-pledge (default-to u0 (map-get? pledges tx-sender))))
    (asserts! (> amount u0) (err u1)) ;; Kiem tra so tien > 0
    ;; (asserts! (< stacks-block-height (var-get deadline)) (err u2)) ;; Kiem tra thoi han
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender))) ;; Chuyen STX vao hop dong
    (map-set pledges tx-sender (+ current-pledge amount)) ;; Cap nhat so tien dong gop
    (var-set total-pledged (+ (var-get total-pledged) amount)) ;; Cap nhat tong so
    (if (>= (var-get total-pledged) (var-get funding-goal))
        (var-set funding-successful true)
        false)
    (ok true)))

;; Ham hoan tien neu khong dat muc tieu
(define-public (refund)
  (let ((pledge-amount (default-to u0 (map-get? pledges tx-sender))))
    (asserts! (>= stacks-block-height (var-get deadline)) (err u3)) ;; Kiem tra da qua thoi han
    (asserts! (not (var-get funding-successful)) (err u4)) ;; Kiem tra that bai
    (asserts! (> pledge-amount u0) (err u5)) ;; Kiem tra nguoi dung co dong gop
    (try! (as-contract (stx-transfer? pledge-amount tx-sender tx-sender))) ;; Hoan tien
    (map-set pledges tx-sender u0) ;; Xoa so tien dong gop
    (ok true)))

;; Ham giai phong quy cho chu du an
(define-public (claim-funds)
  (begin
    (asserts! (is-eq tx-sender (var-get project-owner)) (err u6))
    (asserts! (var-get funding-successful) (err u7))
    (try! (as-contract (stx-transfer? (var-get total-pledged) tx-sender (var-get project-owner))))
    (var-set total-pledged u0) ;; 
    (ok true)))


;; Ham kiem tra trang thai
(define-read-only (get-status)
  (ok {
    funding-goal: (var-get funding-goal),
    total-pledged: (var-get total-pledged),
    deadline: (var-get deadline),
    funding-successful: (var-get funding-successful)
  }))

(define-public (cancel-campaign)
  (begin
    (asserts! (is-eq tx-sender (var-get project-owner)) (err u10))
    (asserts! (not (var-get funding-successful)) (err u11))
    (var-set deadline u0)
    (ok true)))

    
(define-read-only (time-left)
  (let ((now stacks-block-height))
    (ok (if (< now (var-get deadline))
            (- (var-get deadline) now)
            u0))))
